import { createAdminClient } from "@/lib/supabase/server";
import { getPlan, type PlanId } from "@/lib/config/plans";

function currentPeriodStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export interface CreditStatus {
  plan: PlanId;
  used: number;
  limit: number;
  remaining: number;
  canGenerate: boolean;
}

/**
 * Server-only credit check + status. Always reads/writes through the
 * service-role client so a user cannot bypass their monthly limit by
 * calling this from the browser or racing page refreshes — the increment
 * in `consumeGenerationCredit` happens in the same request that performs
 * the generation, never client-side.
 */
export async function getCreditStatus(userId: string): Promise<CreditStatus> {
  const admin = createAdminClient();

  const [{ data: profile }, { data: usage }] = await Promise.all([
    admin.from("profiles").select("plan").eq("id", userId).single(),
    admin.from("usage_credits").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const plan = getPlan(profile?.plan);
  const period = currentPeriodStart();

  let used = 0;
  if (usage && usage.period_start === period) {
    used = usage.plans_generated_this_period;
  }

  const limit = plan.limits.plansPerMonth;
  const remaining = Math.max(0, limit - used);

  return { plan: plan.id, used, limit, remaining, canGenerate: remaining > 0 };
}

/**
 * Atomically checks and increments the usage counter for the current
 * period. Returns false (without incrementing) if the user has no credits
 * left, so the caller must check the result before generating.
 */
export async function consumeGenerationCredit(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const period = currentPeriodStart();

  const { data: profile } = await admin.from("profiles").select("plan").eq("id", userId).single();
  const plan = getPlan(profile?.plan);

  const { data: usage } = await admin.from("usage_credits").select("*").eq("user_id", userId).maybeSingle();

  const isNewPeriod = !usage || usage.period_start !== period;
  const used = isNewPeriod ? 0 : usage.plans_generated_this_period;

  if (used >= plan.limits.plansPerMonth) {
    return false;
  }

  if (usage) {
    const { error } = await admin
      .from("usage_credits")
      .update({
        period_start: period,
        plans_generated_this_period: used + 1,
      })
      .eq("user_id", userId)
      .eq("plans_generated_this_period", usage.plans_generated_this_period);

    if (error) return false;
  } else {
    const { error } = await admin
      .from("usage_credits")
      .insert({ user_id: userId, period_start: period, plans_generated_this_period: 1 });
    if (error) return false;
  }

  return true;
}
