import "server-only";
import Stripe from "stripe";
import { env } from "@/lib/env";

let client: Stripe | null = null;

/** Client Stripe (null si STRIPE_SECRET_KEY n'est pas configurée). */
export function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  client ??= new Stripe(env.STRIPE_SECRET_KEY, { appInfo: { name: "BookSync" }, maxNetworkRetries: 2 });
  return client;
}

export function isBillingConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_STARTER && env.STRIPE_PRICE_PRO);
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
