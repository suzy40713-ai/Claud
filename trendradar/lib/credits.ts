import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlan } from "@/lib/plans";
import type { Profile } from "@/lib/supabase/types";

type Client = SupabaseClient;

/**
 * Ensures the profile's credit balance reflects the current billing cycle.
 * Free/monthly resets are lazy: whenever we touch the profile past its
 * `credits_reset_at`, we top it back up to the plan's monthly allowance.
 */
export async function ensureFreshCredits(
  supabase: Client,
  profile: Profile
): Promise<Profile> {
  const resetAt = new Date(profile.credits_reset_at).getTime();
  if (Date.now() < resetAt) return profile;

  const plan = getPlan(profile.plan);
  const nextReset = new Date();
  nextReset.setDate(nextReset.getDate() + 30);

  const { data, error } = await supabase
    .from("profiles")
    .update({
      search_credits: plan.searchCreditsPerMonth,
      idea_credits_per_search: plan.ideasPerSearch,
      credits_reset_at: nextReset.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select()
    .single();

  if (error || !data) return profile;
  return data as Profile;
}

export interface CreditCheckResult {
  allowed: boolean;
  profile: Profile;
  reason?: string;
}

/**
 * Verifies the user has at least one search credit remaining. Does NOT
 * deduct — call `consumeSearchCredit` after the generation succeeds so
 * failed AI calls don't cost the user a credit.
 */
export async function checkSearchCredit(
  supabase: Client,
  userId: string
): Promise<CreditCheckResult> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("Profile introuvable.");
  }

  const fresh = await ensureFreshCredits(supabase, profile as Profile);

  if (fresh.search_credits <= 0) {
    return {
      allowed: false,
      profile: fresh,
      reason:
        "Tu as atteint ta limite de recherches pour ce mois. Passe à un plan supérieur pour continuer.",
    };
  }

  return { allowed: true, profile: fresh };
}

export async function consumeSearchCredit(
  supabase: Client,
  userId: string,
  reason: string,
  metadata: Record<string, unknown> = {}
): Promise<Profile> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) throw new Error("Profile introuvable.");

  const updated = Math.max(0, (profile as Profile).search_credits - 1);

  const { data, error: updateError } = await supabase
    .from("profiles")
    .update({ search_credits: updated, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (updateError || !data) throw new Error("Impossible de décrémenter les crédits.");

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -1,
    reason,
    metadata,
  });

  return data as Profile;
}

export function canUseFeature(
  profile: Profile,
  feature: keyof ReturnType<typeof getPlan>
): boolean {
  const plan = getPlan(profile.plan);
  return Boolean(plan[feature]);
}
