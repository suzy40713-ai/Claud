import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Returns a configured Stripe client, or null when STRIPE_SECRET_KEY is
 * not set. Every caller must handle the null case by falling back to
 * "dev mode" behaviour (see src/lib/actions/billing.ts) rather than
 * throwing, so the app stays fully usable before Stripe is configured.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  if (!stripeInstance) {
    stripeInstance = new Stripe(key, { apiVersion: "2026-08-26.dahlia" });
  }
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_PRO);
}
