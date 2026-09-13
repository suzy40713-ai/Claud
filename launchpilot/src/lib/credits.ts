import { createAdminClient } from "@/lib/supabase/server";

/** Price of a single generated plan — pay-per-generation, no subscription. */
export const PLAN_PRICE_EUR = 14.99;
export const PLAN_PRICE_CENTS = 1499;
export const CREDITS_PER_PURCHASE = 1;

export interface CreditStatus {
  balance: number;
  canGenerate: boolean;
}

/**
 * Server-only credit check + status. Always reads/writes through the
 * service-role client so a user cannot generate a plan for free by calling
 * this from the browser or racing page refreshes — the decrement in
 * `consumeGenerationCredit` happens in the same request that performs the
 * generation, never client-side.
 */
export async function getCreditStatus(userId: string): Promise<CreditStatus> {
  const admin = createAdminClient();
  const { data } = await admin.from("usage_credits").select("credits_balance").eq("user_id", userId).maybeSingle();
  const balance = data?.credits_balance ?? 0;
  return { balance, canGenerate: balance > 0 };
}

/**
 * Atomically checks and decrements the credit balance. Returns false
 * (without decrementing) if the user has no credit available, so the
 * caller must check the result before generating and redirect to purchase.
 */
export async function consumeGenerationCredit(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: usage } = await admin.from("usage_credits").select("credits_balance").eq("user_id", userId).maybeSingle();

  const balance = usage?.credits_balance ?? 0;
  if (balance <= 0) {
    return false;
  }

  const { error } = await admin
    .from("usage_credits")
    .update({ credits_balance: balance - 1 })
    .eq("user_id", userId)
    .eq("credits_balance", balance);

  return !error;
}

/**
 * Adds credits to a user's balance after a successful purchase (Stripe
 * webhook or dev-mode fallback in `purchasePlanCredit`).
 */
export async function grantCredits(userId: string, amount: number): Promise<void> {
  const admin = createAdminClient();
  const { data: usage } = await admin.from("usage_credits").select("credits_balance").eq("user_id", userId).maybeSingle();

  if (usage) {
    await admin
      .from("usage_credits")
      .update({ credits_balance: usage.credits_balance + amount })
      .eq("user_id", userId);
  } else {
    await admin.from("usage_credits").insert({ user_id: userId, credits_balance: amount });
  }
}
