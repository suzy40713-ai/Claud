import "server-only";
import type Stripe from "stripe";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { invoice, organization, stripeEvent } from "@/db/schema";
import type { PlanId } from "@/domain/billing/plans";
import { assertCan } from "@/domain/permissions";
import { env } from "@/lib/env";
import type { OrgContext } from "@/server/auth/session";
import { UserError } from "@/server/errors";
import { ensureStripeSetup, getPriceIds, getStripe, isBillingConfigured } from "./stripe";

type PaidPlan = Exclude<PlanId, "free">;

export async function priceIdFor(plan: PaidPlan) {
  try {
    return (await getPriceIds())[plan];
  } catch (error) {
    console.error("[stripe] prix introuvables", error);
    throw new UserError("La facturation n'est pas encore configurée.");
  }
}

export async function planForPrice(priceId: string | null | undefined): Promise<PaidPlan | null> {
  if (!priceId) return null;
  const ids = await getPriceIds();
  if (priceId === ids.starter) return "starter";
  if (priceId === ids.pro) return "pro";
  return null;
}

function requireStripe() {
  const stripe = getStripe();
  if (!stripe || !isBillingConfigured())
    throw new UserError(
      "La facturation n'est pas encore configurée. Contactez le support BookSync.",
    );
  return stripe;
}

const appUrl = (path: string) => `${env.NEXT_PUBLIC_APP_URL}${path}`;

async function ensureCustomer(stripe: Stripe, ctx: OrgContext) {
  if (ctx.organization.stripeCustomerId) return ctx.organization.stripeCustomerId;
  const customer = await stripe.customers.create(
    {
      email: ctx.organization.email ?? ctx.user.email,
      name: ctx.organization.name,
      preferred_locales: ["fr"],
      metadata: { organizationId: ctx.organization.id },
    },
    { idempotencyKey: `customer-${ctx.organization.id}` },
  );
  await db
    .update(organization)
    .set({ stripeCustomerId: customer.id })
    .where(eq(organization.id, ctx.organization.id));
  return customer.id;
}

function hasLiveSubscription(ctx: OrgContext) {
  const s = ctx.organization.subscriptionStatus;
  return Boolean(
    ctx.organization.stripeSubscriptionId && s && !["canceled", "incomplete_expired"].includes(s),
  );
}

/**
 * Souscription (redirection vers Stripe Checkout) ou changement d'offre si un abonnement existe déjà
 * (mise à jour immédiate avec prorata).
 */
export async function startSubscription(
  ctx: OrgContext,
  plan: PaidPlan,
): Promise<{ url: string } | { changed: true }> {
  assertCan(ctx.role, "billing.manage");
  const stripe = requireStripe();
  await ensureStripeSetup();
  const price = await priceIdFor(plan);

  if (hasLiveSubscription(ctx)) {
    const sub = await stripe.subscriptions.retrieve(ctx.organization.stripeSubscriptionId!);
    const item = sub.items.data[0];
    if (item.price.id === price && !sub.cancel_at_period_end)
      throw new UserError("Vous êtes déjà sur ce forfait.");
    const updated = await stripe.subscriptions.update(sub.id, {
      items: [{ id: item.id, price }],
      cancel_at_period_end: false,
      proration_behavior: "create_prorations",
      metadata: { organizationId: ctx.organization.id },
    });
    await syncSubscription(updated);
    return { changed: true };
  }

  const customer = await ensureCustomer(stripe, ctx);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    locale: "fr",
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    client_reference_id: ctx.organization.id,
    subscription_data: { metadata: { organizationId: ctx.organization.id } },
    metadata: { organizationId: ctx.organization.id },
    success_url: appUrl(
      "/tableau-de-bord/abonnement?paiement=succes&session={CHECKOUT_SESSION_ID}",
    ),
    cancel_url: appUrl("/tableau-de-bord/abonnement?paiement=annule"),
  });
  if (!session.url) throw new UserError("Impossible d'ouvrir la page de paiement.");
  return { url: session.url };
}

/** Résiliation à la fin de la période payée (ou reprise de l'abonnement). */
export async function setCancelAtPeriodEnd(ctx: OrgContext, cancel: boolean) {
  assertCan(ctx.role, "billing.manage");
  const stripe = requireStripe();
  if (!ctx.organization.stripeSubscriptionId) throw new UserError("Aucun abonnement en cours.");
  const sub = await stripe.subscriptions.update(ctx.organization.stripeSubscriptionId, {
    cancel_at_period_end: cancel,
  });
  await syncSubscription(sub);
}

/** Portail client Stripe : moyen de paiement, coordonnées de facturation, factures. */
export async function createPortalSession(ctx: OrgContext) {
  assertCan(ctx.role, "billing.manage");
  const stripe = requireStripe();
  const customer = await ensureCustomer(stripe, ctx);
  const session = await stripe.billingPortal.sessions.create({
    customer,
    locale: "fr",
    return_url: appUrl("/tableau-de-bord/abonnement"),
  });
  return session.url;
}

/** Après le retour de Checkout : synchronisation immédiate (le webhook le fera aussi, de façon idempotente). */
export async function confirmCheckout(ctx: OrgContext, sessionId: string) {
  const stripe = getStripe();
  if (!stripe || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return;
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  if (session.metadata?.organizationId !== ctx.organization.id) return;
  if (session.subscription && typeof session.subscription !== "string")
    await syncSubscription(session.subscription);
}

async function findOrganization(customerId: string | null, orgId?: string | null) {
  const [org] = await db
    .select()
    .from(organization)
    .where(
      orgId
        ? or(
            eq(organization.id, orgId),
            customerId ? eq(organization.stripeCustomerId, customerId) : undefined,
          )
        : eq(organization.stripeCustomerId, customerId ?? "__none__"),
    )
    .limit(1);
  return org ?? null;
}

/** Recopie l'état d'un abonnement Stripe sur l'entreprise (source de vérité : Stripe). */
export async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const org = await findOrganization(customerId, sub.metadata?.organizationId);
  if (!org) return null;
  // Un ancien abonnement terminé ne doit pas écraser un abonnement plus récent.
  if (org.stripeSubscriptionId && org.stripeSubscriptionId !== sub.id && sub.status === "canceled")
    return org.id;
  const item = sub.items.data[0];
  const plan = await planForPrice(item?.price.id);
  const ended = ["canceled", "incomplete_expired", "unpaid"].includes(sub.status);
  await db
    .update(organization)
    .set({
      plan: ended || !plan ? "free" : plan,
      stripeCustomerId: customerId,
      stripeSubscriptionId: ended ? null : sub.id,
      subscriptionStatus: sub.status,
      currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    })
    .where(eq(organization.id, org.id));
  return org.id;
}

export async function upsertInvoice(inv: Stripe.Invoice) {
  const customerId = typeof inv.customer === "string" ? inv.customer : (inv.customer?.id ?? null);
  const org = await findOrganization(
    customerId,
    inv.parent?.subscription_details?.metadata?.organizationId ?? null,
  );
  if (!org || !inv.id) return;
  const line = inv.lines?.data?.[0];
  const values = {
    organizationId: org.id,
    stripeInvoiceId: inv.id,
    number: inv.number,
    status: inv.status ?? "draft",
    amountDueCents: inv.amount_due,
    amountPaidCents: inv.amount_paid,
    currency: inv.currency,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    invoicePdfUrl: inv.invoice_pdf ?? null,
    periodStart: line?.period?.start ? new Date(line.period.start * 1000) : null,
    periodEnd: line?.period?.end ? new Date(line.period.end * 1000) : null,
    issuedAt: new Date(inv.created * 1000),
  };
  await db
    .insert(invoice)
    .values(values)
    .onConflictDoUpdate({ target: invoice.stripeInvoiceId, set: values });
}

/**
 * Traitement d'un événement de webhook vérifié. Idempotent : un événement déjà traité est ignoré.
 * Renvoie false si l'événement avait déjà été traité.
 */
export async function handleStripeEvent(event: Stripe.Event, stripe: Stripe) {
  const [fresh] = await db
    .insert(stripeEvent)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing()
    .returning();
  if (!fresh) return false;
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        if (s.mode === "subscription" && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            typeof s.subscription === "string" ? s.subscription : s.subscription.id,
          );
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        await syncSubscription(event.data.object);
        break;
      case "invoice.finalized":
      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.voided":
      case "invoice.marked_uncollectible":
        await upsertInvoice(event.data.object);
        break;
      default:
        break;
    }
  } catch (error) {
    // Échec : on retire la trace pour que Stripe puisse renvoyer l'événement.
    await db.delete(stripeEvent).where(eq(stripeEvent.id, event.id));
    throw error;
  }
  return true;
}

export async function listInvoices(ctx: OrgContext) {
  assertCan(ctx.role, "billing.manage");
  return db
    .select()
    .from(invoice)
    .where(eq(invoice.organizationId, ctx.organization.id))
    .orderBy(desc(invoice.issuedAt))
    .limit(50);
}
