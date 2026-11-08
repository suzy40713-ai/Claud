import "server-only";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { appSetting } from "@/db/schema";
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
  starter: { lookupKey: "booksync_starter_monthly", name: "BookSync Starter", amount: 999 },
  pro: { lookupKey: "booksync_pro_monthly", name: "BookSync Pro", amount: 1999 },
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
    if (!price) {
      const product = await stripe.products.create(
        { name: def.name, metadata: { app: "booksync", plan } },
        { idempotencyKey: `booksync-product-${def.lookupKey}` },
      );
      price = await stripe.prices.create(
        {
          product: product.id,
          currency: "eur",
          unit_amount: def.amount,
          recurring: { interval: "month" },
          tax_behavior: "inclusive",
          lookup_key: def.lookupKey,
        },
        { idempotencyKey: `booksync-price-${def.lookupKey}` },
      );
      console.info(`[stripe] prix créé : ${def.name} (${price.id})`);
    }
    result[plan] = price.id;
  }
  priceCache = result;
  return result;
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

let setupDone = false;

/** Configuration complète et idempotente (appelée par le planificateur et avant tout paiement). */
export async function ensureStripeSetup() {
  if (setupDone || !getStripe()) return;
  await getPriceIds();
  await ensureWebhookEndpoint();
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
