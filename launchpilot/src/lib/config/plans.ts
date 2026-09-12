/**
 * Single source of truth for plan limits and pricing. Change numbers here to
 * retune the whole app — the credit-enforcement logic in
 * `src/lib/credits.ts` reads exclusively from this file.
 */

export type PlanId = "free" | "pro";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number;
  currency: string;
  stripePriceId: string | undefined;
  limits: {
    /** Number of full marketing plans (onboarding -> report generation) allowed. */
    plansPerMonth: number;
    /** Number of content ideas generated per plan. */
    contentIdeas: number;
    /** How many days of the 30-day calendar are unlocked. */
    calendarDays: number;
    /** Whether TikTok/Reels/Shorts scripts are generated. */
    scripts: boolean;
    /** Whether ad concepts are generated. */
    adCampaigns: boolean;
    /** Whether the advanced sub-score analysis + product page audit are available. */
    advancedAnalysis: boolean;
  };
  features: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    description: "Pour tester LaunchPilot et découvrir ton plan de lancement.",
    priceMonthly: 0,
    currency: "EUR",
    stripePriceId: undefined,
    limits: {
      plansPerMonth: 1,
      contentIdeas: 5,
      calendarDays: 7,
      scripts: false,
      adCampaigns: false,
      advancedAnalysis: false,
    },
    features: [
      "1 plan marketing",
      "5 idées de contenu",
      "Aperçu du plan 30 jours (7 premiers jours)",
      "Score marketing de base",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Pour exécuter ton lancement à fond, du contenu aux publicités.",
    priceMonthly: 29,
    currency: "EUR",
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO,
    limits: {
      plansPerMonth: 10,
      contentIdeas: 30,
      calendarDays: 30,
      scripts: true,
      adCampaigns: true,
      advancedAnalysis: true,
    },
    features: [
      "Jusqu'à 10 plans marketing par mois",
      "30 idées de contenu avec scripts complets",
      "Calendrier complet sur 30 jours",
      "Campagnes publicitaires",
      "Analyse avancée + audit de page produit",
      "Emails marketing prêts à l'emploi",
    ],
  },
};

export const DEFAULT_PLAN: PlanId = "free";

export function getPlan(planId: string | null | undefined): PlanDefinition {
  if (planId === "pro") return PLANS.pro;
  return PLANS.free;
}
