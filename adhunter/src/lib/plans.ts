import type { PlanId, PlanLimits, SubscriptionStatus } from "@/types/database";

export type FeatureKey = "ad_creator" | "search_history" | "trend_radar" | "teams" | "exports" | "advanced_search";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceCents: number;
  tagline: string;
  limits: PlanLimits;
  features: FeatureKey[];
  highlights: string[];
}

/**
 * Default plan catalogue. The `plans` table (editable from /admin) overrides
 * limits, prices and features at runtime; these values are the fallback and
 * the source for the marketing pages.
 */
export const DEFAULT_PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceCents: 0,
    tagline: "Découvrir la plateforme",
    limits: {
      searches_per_month: 20,
      ai_analyses_per_month: 5,
      ai_creations_per_month: 0,
      collections_max: 1,
      results_per_search: 12,
      exports_per_month: 0,
    },
    features: [],
    highlights: ["20 recherches par mois", "5 analyses IA par mois", "1 collection", "Favoris et notes personnelles"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 1999,
    tagline: "Pour les e-commerçants et dropshippers actifs",
    limits: {
      searches_per_month: 500,
      ai_analyses_per_month: 100,
      ai_creations_per_month: 100,
      collections_max: -1,
      results_per_search: 24,
      exports_per_month: 0,
    },
    features: ["ad_creator", "search_history", "trend_radar"],
    highlights: [
      "500 recherches par mois",
      "100 analyses IA par mois",
      "Collections illimitées",
      "Ad Creator (100 générations / mois)",
      "Historique des recherches",
      "Trend Radar",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    priceCents: 4999,
    tagline: "Pour les agences et équipes marketing",
    limits: {
      searches_per_month: 3000,
      ai_analyses_per_month: 500,
      ai_creations_per_month: 500,
      collections_max: -1,
      results_per_search: 50,
      exports_per_month: 200,
    },
    features: ["ad_creator", "search_history", "trend_radar", "teams", "exports", "advanced_search"],
    highlights: [
      "Toutes les fonctionnalités Pro",
      "3 000 recherches par mois",
      "500 analyses IA par mois",
      "Espace équipe et collections partagées",
      "Rapports exportables (CSV, JSON)",
      "Recherche avancée (annonceur, statut, 50 résultats)",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "business"];

export const FEATURE_LABELS: Record<FeatureKey, { label: string; minPlan: PlanId }> = {
  ad_creator: { label: "Ad Creator", minPlan: "pro" },
  search_history: { label: "Historique des recherches", minPlan: "pro" },
  trend_radar: { label: "Trend Radar", minPlan: "pro" },
  teams: { label: "Travail en équipe", minPlan: "business" },
  exports: { label: "Rapports exportables", minPlan: "business" },
  advanced_search: { label: "Recherche avancée", minPlan: "business" },
};

/** Statuses that keep paid access. `past_due` keeps access while Stripe retries the payment. */
const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "trialing", "past_due"];

export interface SubscriptionLike {
  plan: PlanId;
  status: SubscriptionStatus;
  current_period_end: string | null;
  source: "stripe" | "manual";
}

/** Resolves the plan a user is actually entitled to right now. */
export function effectivePlan(sub: SubscriptionLike | null | undefined, now = new Date()): PlanId {
  if (!sub || sub.plan === "free") return "free";
  if (!ACTIVE_STATUSES.includes(sub.status)) return "free";
  // Manual grants (admin) may carry an expiry date.
  if (sub.source === "manual" && sub.current_period_end && new Date(sub.current_period_end) < now) return "free";
  return sub.plan;
}

export function hasFeature(features: readonly string[], feature: FeatureKey) {
  return features.includes(feature);
}

export function isUnlimited(limit: number) {
  return limit < 0;
}

/** Quotas reset on the first day of each calendar month (UTC). */
export function currentPeriodStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function nextPeriodStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
}

export function planRank(plan: PlanId) {
  return PLAN_ORDER.indexOf(plan);
}

/** Merges a DB row over the default definition, tolerating partial/missing limits. */
export function mergePlan(
  base: PlanDefinition,
  row?: { name?: string; price_cents?: number; limits?: Partial<PlanLimits> | null; features?: string[] | null } | null
): PlanDefinition {
  if (!row) return base;
  return {
    ...base,
    name: row.name ?? base.name,
    priceCents: row.price_cents ?? base.priceCents,
    limits: { ...base.limits, ...(row.limits ?? {}) },
    features: (row.features as FeatureKey[] | null | undefined) ?? base.features,
  };
}
