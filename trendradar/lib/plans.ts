import type { Plan } from "@/lib/supabase/types";

/**
 * Single source of truth for plan limits. Change numbers here to
 * retune the product — the credit system reads from this file only.
 */
export const PLANS: Record<
  Plan,
  {
    name: string;
    priceLabel: string;
    priceCents: number;
    stripePriceEnv: string | null;
    searchCreditsPerMonth: number;
    ideasPerSearch: number;
    features: string[];
    hasOpportunityScore: boolean;
    hasScriptGeneration: boolean;
    hasVariants: boolean;
    hasCalendar: boolean;
    hasAdvancedAnalytics: boolean;
    hasBulkGeneration: boolean;
    hasMultiNiche: boolean;
    unlimitedSaves: boolean;
  }
> = {
  free: {
    name: "Free",
    priceLabel: "0 €",
    priceCents: 0,
    stripePriceEnv: null,
    searchCreditsPerMonth: 5,
    ideasPerSearch: 10,
    features: [
      "5 recherches / mois",
      "10 idées par recherche",
      "Sauvegardes limitées",
    ],
    hasOpportunityScore: true,
    hasScriptGeneration: false,
    hasVariants: false,
    hasCalendar: false,
    hasAdvancedAnalytics: false,
    hasBulkGeneration: false,
    hasMultiNiche: false,
    unlimitedSaves: false,
  },
  creator: {
    name: "Creator",
    priceLabel: "14,99 €",
    priceCents: 1499,
    stripePriceEnv: "STRIPE_PRICE_CREATOR",
    searchCreditsPerMonth: 60,
    ideasPerSearch: 20,
    features: [
      "Recherches beaucoup plus nombreuses",
      "20 idées par recherche",
      "Opportunity Score",
      "Génération de scripts",
      "Variantes d'idées",
      "Calendrier de contenu",
      "Sauvegardes illimitées",
    ],
    hasOpportunityScore: true,
    hasScriptGeneration: true,
    hasVariants: true,
    hasCalendar: true,
    hasAdvancedAnalytics: false,
    hasBulkGeneration: false,
    hasMultiNiche: false,
    unlimitedSaves: true,
  },
  pro: {
    name: "Pro",
    priceLabel: "29,99 €",
    priceCents: 2999,
    stripePriceEnv: "STRIPE_PRICE_PRO",
    searchCreditsPerMonth: 200,
    ideasPerSearch: 20,
    features: [
      "Toutes les fonctionnalités Creator",
      "Analyses avancées",
      "Génération massive",
      "Plusieurs niches",
      "Fonctionnalités prioritaires",
    ],
    hasOpportunityScore: true,
    hasScriptGeneration: true,
    hasVariants: true,
    hasCalendar: true,
    hasAdvancedAnalytics: true,
    hasBulkGeneration: true,
    hasMultiNiche: true,
    unlimitedSaves: true,
  },
};

export const SAVE_LIMIT_FREE = 10;

export function getPlan(plan: Plan) {
  return PLANS[plan];
}
