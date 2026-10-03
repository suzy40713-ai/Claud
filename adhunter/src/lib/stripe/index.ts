import "server-only";

import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/server";
import type { PlanId, SubscriptionStatus } from "@/types/database";

let stripe: Stripe | null = null;

/** Server-only Stripe client. Returns null when STRIPE_SECRET_KEY is not set. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe ??= new Stripe(key, { maxNetworkRetries: 2 });
  return stripe;
}

/** Price ID for a paid plan: admin-configured value in `plans`, else env. */
export async function priceIdForPlan(plan: Exclude<PlanId, "free">): Promise<string | null> {
  const { data } = await createAdminClient().from("plans").select("stripe_price_id").eq("id", plan).maybeSingle();
  if (data?.stripe_price_id) return data.stripe_price_id;
  return (plan === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_BUSINESS) || null;
}

export async function planForPriceId(priceId: string | null | undefined): Promise<PlanId | null> {
  if (!priceId) return null;
  const { data } = await createAdminClient().from("plans").select("id").eq("stripe_price_id", priceId).maybeSingle();
  if (data?.id) return data.id;
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return "business";
  return null;
}

const KNOWN_STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "paused",
];

/** Mirrors a Stripe subscription into `subscriptions` (service role). */
export async function syncSubscription(sub: Stripe.Subscription) {
  const admin = createAdminClient();
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const item = sub.items.data[0];
  const priceId = item?.price.id ?? null;

  let userId: string | undefined = sub.metadata?.supabase_user_id;
  if (!userId) {
    const { data } = await admin.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) {
    throw new Error(`No user found for Stripe customer ${customerId}`);
  }

  const plan = (await planForPriceId(priceId)) ?? "free";
  const status = KNOWN_STATUSES.includes(sub.status as SubscriptionStatus) ? (sub.status as SubscriptionStatus) : "inactive";
  // `current_period_end` lives on subscription items in recent API versions.
  const periodEnd = (item as unknown as { current_period_end?: number })?.current_period_end
    ?? (sub as unknown as { current_period_end?: number }).current_period_end;

  const { error } = await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    plan: status === "canceled" || status === "incomplete_expired" ? "free" : plan,
    status,
    price_id: priceId,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end || Boolean(sub.cancel_at),
    source: "stripe",
  });
  if (error) throw error;
}
