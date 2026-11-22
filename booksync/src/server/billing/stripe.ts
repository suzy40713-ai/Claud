import "server-only";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { appSetting } from "@/db/schema";
import { PLANS } from "@/domain/billing/plans";
import { env } from "@/lib/env";

let client: Stripe | null = null;

/** Client Stripe (null si STRIPE_SECRET_KEY n'est pas configurée). */
export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  client ??= new Stripe(env.STRIPE_SECRET_KEY, {
    appInfo: { name: "BookSync" },
    maxNetworkRetries: 2,
  });
  return client;
}

/** La facturation est active dès qu'une clé secrète Stripe est fournie (le reste est automatique). */
export function isBillingConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY);
}

/* ───────────── Configuration automatique (offres + webhook) ───────────── */

export const PLAN_PRICES = {
  starter: {
    lookupKey: "booksync_starter_monthly",
    name: "BookSync Starter",
    amount: PLANS.starter.priceCents,
  },
  pro: { lookupKey: "booksync_pro_monthly", name: "BookSync Pro", amount: PLANS.pro.priceCents },
} as const;

export type PaidPlanId = keyof typeof PLAN_PRICES;

let priceCache: Record<PaidPlanId, string> | null = null;

/**
 * Identifiants des prix Starter et Pro : variables d'environnement si fournies,
 * sinon retrouvés (ou créés une seule fois) dans Stripe grâce à leur « lookup key ».
 */
export async function getPriceIds(): Promise<Record<PaidPlanId, string>> {
  if (env.STRIPE_PRICE_STARTER && env.STRIPE_PRICE_PRO) {
    return { starter: env.STRIPE_PRICE_STARTER, pro: env.STRIPE_PRICE_PRO };
  }
  if (priceCache) return priceCache;
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe n'est pas configuré.");
  const result = {} as Record<PaidPlanId, string>;
  for (const [plan, def] of Object.entries(PLAN_PRICES) as [
    PaidPlanId,
    (typeof PLAN_PRICES)[PaidPlanId],
  ][]) {
    const found = await stripe.prices.list({
      lookup_keys: [def.lookupKey],
      active: true,
      limit: 1,
    });
    let price = found.data[0];
    if (!price || price.unit_amount !== def.amount) {
      // Nouveau tarif configuré : un nouveau prix est créé sur le même produit et reprend la
      // « lookup key ». Les abonnements existants conservent leur prix jusqu'à leur changement.
      const productId =
        typeof price?.product === "string"
          ? price.product
          : (
              await stripe.products.create(
                { name: def.name, metadata: { app: "booksync", plan } },
                { idempotencyKey: `booksync-product-${def.lookupKey}` },
              )
            ).id;
      price = await stripe.prices.create(
        {
          product: productId,
          currency: "eur",
          unit_amount: def.amount,
          recurring: { interval: "month" },
          tax_behavior: "inclusive",
          lookup_key: def.lookupKey,
          transfer_lookup_key: true,
        },
        { idempotencyKey: `booksync-price-${def.lookupKey}-${def.amount}` },
      );
      console.info(`[stripe] prix créé : ${def.name} ${def.amount / 100} € (${price.id})`);
    }
    result[plan] = price.id;
  }
  priceCache = result;
  return result;
}

/**
 * Changement d'adresse du site (domaine personnalisé) : les points de réception créés
 * automatiquement par BookSync pour l'ancienne adresse sont supprimés (leur secret n'est plus
 * connu, Stripe les signalerait en échec). Les points créés à la main ne sont jamais touchés.
 */
async function removeStaleEndpoints(
  stripe: Stripe,
  endpoints: Stripe.WebhookEndpoint[],
  path: string,
  currentUrl: string,
) {
  for (const e of endpoints) {
    if (e.url !== currentUrl && e.url.endsWith(path) && e.description?.startsWith("BookSync")) {
      await stripe.webhookEndpoints.del(e.id);
      console.info(`[stripe] ancien webhook supprimé : ${e.url}`);
    }
  }
}

const WEBHOOK_SETTING = "stripe_webhook_secret";
const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.finalized",
  "invoice.paid",
  "invoice.payment_failed",
];

/** Secret de signature des webhooks : variable d'environnement, sinon celui créé automatiquement (en base). */
export async function getWebhookSecret(): Promise<string | null> {
  if (env.STRIPE_WEBHOOK_SECRET) return env.STRIPE_WEBHOOK_SECRET;
  const [row] = await db
    .select()
    .from(appSetting)
    .where(eq(appSetting.key, WEBHOOK_SETTING))
    .limit(1);
  return row?.value ?? null;
}

/**
 * Crée le point de réception des webhooks Stripe s'il n'existe pas encore pour l'URL de l'application.
 * Stripe ne renvoie le secret qu'à la création : il est conservé en base, jamais affiché.
 */
export async function ensureWebhookEndpoint() {
  const stripe = getStripe();
  if (!stripe || env.STRIPE_WEBHOOK_SECRET) return;
  const url = `${env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`;
  const stored = await getWebhookSecret();
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((e) => e.url === url);
  if (existing && stored) return;
  // Point existant mais secret inconnu : on le recrée pour obtenir un secret.
  if (existing) await stripe.webhookEndpoints.del(existing.id);
  await removeStaleEndpoints(stripe, endpoints.data, "/api/stripe/webhook", url);
  const created = await stripe.webhookEndpoints.create({
    url,
    enabled_events: WEBHOOK_EVENTS,
    description: "BookSync (configuration automatique)",
  });
  if (!created.secret) throw new Error("Stripe n'a pas renvoyé de secret de webhook.");
  await db
    .insert(appSetting)
    .values({ key: WEBHOOK_SETTING, value: created.secret })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: created.secret } });
  console.info(`[stripe] webhook créé pour ${url}`);
}

const CONNECT_WEBHOOK_SETTING = "stripe_connect_webhook_secret";
const CONNECT_WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.expired",
  "account.updated",
  "account.application.deauthorized",
];

/** Secret du webhook des comptes connectés (acomptes) : variable d'environnement ou créé automatiquement. */
export async function getConnectWebhookSecret(): Promise<string | null> {
  if (env.STRIPE_CONNECT_WEBHOOK_SECRET) return env.STRIPE_CONNECT_WEBHOOK_SECRET;
  const [row] = await db
    .select()
    .from(appSetting)
    .where(eq(appSetting.key, CONNECT_WEBHOOK_SETTING))
    .limit(1);
  return row?.value ?? null;
}

/** Point de réception des événements des comptes Stripe des professionnels (paiement des acomptes). */
export async function ensureConnectWebhookEndpoint() {
  const stripe = getStripe();
  if (!stripe || env.STRIPE_CONNECT_WEBHOOK_SECRET) return;
  const url = `${env.NEXT_PUBLIC_APP_URL}/api/stripe/connect`;
  const stored = await getConnectWebhookSecret();
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((e) => e.url === url);
  if (existing && stored) return;
  if (existing) await stripe.webhookEndpoints.del(existing.id);
  await removeStaleEndpoints(stripe, endpoints.data, "/api/stripe/connect", url);
  const created = await stripe.webhookEndpoints.create({
    url,
    connect: true,
    enabled_events: CONNECT_WEBHOOK_EVENTS,
    description: "BookSync — acomptes des comptes connectés (configuration automatique)",
  });
  if (!created.secret) throw new Error("Stripe n'a pas renvoyé de secret de webhook.");
  await db
    .insert(appSetting)
    .values({ key: CONNECT_WEBHOOK_SETTING, value: created.secret })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: created.secret } });
  console.info(`[stripe] webhook Connect créé pour ${url}`);
}

let setupDone = false;

/** Configuration complète et idempotente (appelée par le planificateur et avant tout paiement). */
export async function ensureStripeSetup() {
  if (setupDone || !getStripe()) return;
  await getPriceIds();
  await ensureWebhookEndpoint();
  // Acomptes (Stripe Connect) : un échec ne doit jamais bloquer les abonnements BookSync.
  try {
    await ensureConnectWebhookEndpoint();
  } catch (error) {
    console.error("[stripe] webhook Connect non créé (Connect activé sur le compte ?)", error);
    return;
  }
  setupDone = true;
}

/** Résiliation immédiate (suppression de compte). */
export async function cancelSubscriptionNow(subscriptionId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe n'est pas configuré : impossible de résilier l'abonnement.");
  try {
    await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    if ((error as { code?: string }).code === "resource_missing") return;
    throw error;
  }
}
