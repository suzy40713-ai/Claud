import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { integrations } from "@/lib/env";
import { UserFacingError } from "@/lib/errors";
import {
  DEFAULT_PLANS,
  FEATURE_LABELS,
  currentPeriodStart,
  effectivePlan,
  hasFeature,
  mergePlan,
  type FeatureKey,
  type PlanDefinition,
} from "@/lib/plans";
import type { PlanId, Tables, UsageKind } from "@/types/database";

export interface Account {
  user: { id: string; email: string };
  profile: Tables<"profiles">;
  subscription: Tables<"subscriptions"> | null;
  plan: PlanDefinition;
  planId: PlanId;
  isAdmin: boolean;
}

/** Loads plan definitions from the DB (admin-editable), falling back to defaults. */
export const getPlans = cache(async (): Promise<Record<PlanId, PlanDefinition>> => {
  if (!integrations.supabase()) return DEFAULT_PLANS;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("plans").select("*");
    const rows = new Map((data ?? []).map((r) => [r.id, r]));
    return {
      free: mergePlan(DEFAULT_PLANS.free, rows.get("free")),
      pro: mergePlan(DEFAULT_PLANS.pro, rows.get("pro")),
      business: mergePlan(DEFAULT_PLANS.business, rows.get("business")),
    };
  } catch {
    return DEFAULT_PLANS;
  }
});

/** Returns the signed-in account or null. Cached per request. */
export const getAccount = cache(async (): Promise<Account | null> => {
  if (!integrations.supabase()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: subscription }, plans] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    getPlans(),
  ]);

  const fallbackProfile: Tables<"profiles"> = {
    id: user.id,
    email: user.email ?? "",
    full_name: null,
    role: "user",
    tutorial_completed: false,
    marketing_opt_in: false,
    terms_accepted_at: null,
    preferred_niches: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const planId = effectivePlan(subscription);
  const resolvedProfile = profile ?? fallbackProfile;
  return {
    user: { id: user.id, email: user.email ?? "" },
    profile: resolvedProfile,
    subscription: subscription ?? null,
    plan: plans[planId],
    planId,
    isAdmin: resolvedProfile.role === "admin" || adminEmails.includes((user.email ?? "").toLowerCase()),
  };
});

/** For pages: redirects to /login when signed out. */
export async function requireAccount(next = "/app"): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect(`/login?next=${encodeURIComponent(next)}`);
  return account;
}

/** For server actions / route handlers: throws instead of redirecting. */
export async function requireAccountOrThrow(): Promise<Account> {
  const account = await getAccount();
  if (!account) throw new UserFacingError("Ta session a expiré. Reconnecte-toi pour continuer.", "unauthorized");
  return account;
}

export async function requireAdmin(): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect("/login?next=/admin");
  if (!account.isAdmin) redirect("/app");
  return account;
}

export function assertFeature(account: Account, feature: FeatureKey) {
  if (!hasFeature(account.plan.features, feature)) {
    const meta = FEATURE_LABELS[feature];
    throw new UserFacingError(
      `${meta.label} est disponible à partir de la formule ${DEFAULT_PLANS[meta.minPlan].name}.`,
      "plan_required"
    );
  }
}

/** Global admin kill-switches. Missing flag = enabled. */
export const getFeatureFlags = cache(async (): Promise<Record<string, boolean>> => {
  if (!integrations.supabase()) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("feature_flags").select("key, enabled");
  return Object.fromEntries((data ?? []).map((f) => [f.key, f.enabled]));
});

export async function assertFlag(key: string, label: string) {
  const flags = await getFeatureFlags();
  if (flags[key] === false) {
    throw new UserFacingError(`${label} est temporairement indisponible. Réessaie plus tard.`, "disabled");
  }
}

const QUOTA_FIELD: Record<UsageKind, keyof PlanDefinition["limits"]> = {
  search: "searches_per_month",
  analysis: "ai_analyses_per_month",
  creation: "ai_creations_per_month",
  export: "exports_per_month",
};

const QUOTA_LABEL: Record<UsageKind, string> = {
  search: "recherches",
  analysis: "analyses IA",
  creation: "générations Ad Creator",
  export: "exports",
};

/**
 * Atomically consumes one unit of quota (server-side, service role). Throws a
 * friendly error when the monthly limit is reached.
 */
export async function consumeQuota(account: Account, kind: UsageKind) {
  const limit = account.plan.limits[QUOTA_FIELD[kind]];
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("consume_quota", {
    p_user: account.user.id,
    p_kind: kind,
    p_limit: limit,
    p_since: currentPeriodStart().toISOString(),
  });
  if (error) throw error;
  if (!data) {
    throw new UserFacingError(
      limit === 0
        ? `Les ${QUOTA_LABEL[kind]} ne sont pas incluses dans ta formule ${account.plan.name}.`
        : `Tu as atteint ta limite de ${limit} ${QUOTA_LABEL[kind]} ce mois-ci. Passe à une formule supérieure ou attends le 1er du mois prochain.`,
      "quota_exceeded"
    );
  }
}

export async function refundQuota(account: Account, kind: UsageKind) {
  try {
    await createAdminClient().rpc("refund_quota", { p_user: account.user.id, p_kind: kind });
  } catch {
    // best effort
  }
}

export async function getUsage(account: Account) {
  const supabase = await createClient();
  const since = currentPeriodStart().toISOString();
  const { data } = await supabase
    .from("usage_events")
    .select("kind")
    .eq("user_id", account.user.id)
    .gte("created_at", since)
    .limit(10000);
  const counts: Record<UsageKind, number> = { search: 0, analysis: 0, creation: 0, export: 0 };
  for (const row of data ?? []) counts[row.kind] += 1;
  return {
    counts,
    limits: {
      search: account.plan.limits.searches_per_month,
      analysis: account.plan.limits.ai_analyses_per_month,
      creation: account.plan.limits.ai_creations_per_month,
      export: account.plan.limits.exports_per_month,
    } as Record<UsageKind, number>,
  };
}
