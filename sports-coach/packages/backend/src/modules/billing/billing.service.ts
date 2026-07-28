import Stripe from "stripe";
import { env } from "../../lib/env.js";
import { prisma } from "../../lib/prisma.js";
import type { User } from "@prisma/client";

let stripeClient: Stripe | null = null;

export function isBillingConfigured(): boolean {
  return Boolean(env.stripeSecretKey && env.stripePremiumPriceId);
}

export function isWebhookConfigured(): boolean {
  return Boolean(env.stripeWebhookSecret);
}

function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw Object.assign(
      new Error("STRIPE_SECRET_KEY non configure : l'abonnement premium est indisponible."),
      { statusCode: 503 }
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}

/**
 * Un utilisateur est premium si son abonnement Stripe est actif ET que la
 * fin de periode courante n'est pas depassee (filet de securite si un
 * webhook de resiliation a ete manque).
 */
export function isPremium(user: Pick<User, "subscriptionStatus" | "subscriptionCurrentPeriodEnd">): boolean {
  if (user.subscriptionStatus !== "actif") return false;
  if (user.subscriptionCurrentPeriodEnd && user.subscriptionCurrentPeriodEnd.getTime() < Date.now()) {
    return false;
  }
  return true;
}

async function ensureStripeCustomer(userId: string, email: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({ email, metadata: { userId } });
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckoutSessionUrl(
  userId: string,
  email: string,
  frontendOrigin: string
): Promise<string> {
  const stripe = getStripe();
  const customerId = await ensureStripeCustomer(userId, email);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: env.stripePremiumPriceId!, quantity: 1 }],
    success_url: `${frontendOrigin}/abonnement?checkout=succes`,
    cancel_url: `${frontendOrigin}/abonnement?checkout=annule`,
    client_reference_id: userId,
    subscription_data: { metadata: { userId } },
  });

  if (!session.url) {
    throw new Error("Stripe n'a pas renvoye d'URL de paiement.");
  }
  return session.url;
}

export async function createPortalSessionUrl(userId: string, frontendOrigin: string): Promise<string> {
  const stripe = getStripe();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.stripeCustomerId) {
    throw Object.assign(new Error("Aucun abonnement Stripe associe a ce compte."), { statusCode: 409 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${frontendOrigin}/abonnement`,
  });
  return session.url;
}

function mapStripeStatus(status: Stripe.Subscription.Status): "actif" | "impaye" | "annule" {
  switch (status) {
    case "active":
    case "trialing":
      return "actif";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "impaye";
    default:
      return "annule";
  }
}

async function syncSubscriptionFromStripe(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });

  if (!user) {
    console.error(`Webhook Stripe : aucun utilisateur trouve pour le client ${customerId}`);
    return;
  }

  const currentPeriodEndSeconds = subscription.items.data[0]?.current_period_end;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: mapStripeStatus(subscription.status),
      subscriptionCurrentPeriodEnd: currentPeriodEndSeconds ? new Date(currentPeriodEndSeconds * 1000) : null,
    },
  });
}

export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  if (!env.stripeWebhookSecret) {
    throw Object.assign(new Error("STRIPE_WEBHOOK_SECRET non configure."), { statusCode: 503 });
  }
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
}

/**
 * Traite un evenement webhook Stripe deja verifie. Les changements de statut
 * d'abonnement (creation, mise a jour, resiliation) sont toujours pousses
 * depuis Stripe vers notre base, jamais l'inverse.
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.subscription === "string") {
        const stripe = getStripe();
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscriptionFromStripe(subscription);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await syncSubscriptionFromStripe(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "annule", subscriptionCurrentPeriodEnd: null },
        });
      }
      break;
    }
    default:
      break;
  }
}
