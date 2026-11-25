/**
 * Forfaits BookSync et leurs limites. Toute vérification de limite côté serveur passe par ici.
 * Les PRIX se configurent ici (`priceCents`) : au déploiement suivant, BookSync crée lui-même le
 * nouveau prix dans Stripe et l'utilise pour les nouveaux abonnements (voir billing/stripe.ts).
 */

export type PlanId = "free" | "starter" | "pro" | "business";

export type PlanFeatures = {
  emailNotifications: boolean;
  automaticReminders: boolean;
  advancedStats: boolean;
  bookingPageCustomization: boolean;
  /** Lien de visio (Meet, Zoom…) transmis aux clients pour les rendez-vous en ligne. */
  onlineMeetings: boolean;
};

export type Plan = {
  id: PlanId;
  name: string;
  priceCents: number;
  tagline: string;
  /** null = illimité */
  limits: {
    bookingsPerMonth: number | null;
    members: number;
    customers: number | null;
    /** Produits suivis par le copilote marketing. */
    products: number;
    /** Propositions par mois (analyses, stratégies, publicités, contenus, Sales Booster). */
    toolRunsPerMonth: number | null;
    /** Résultats rédigés par l'IA gratuite par jour ; au-delà, modèles BookSync (illimités). */
    aiRunsPerDay: number;
  };
  features: PlanFeatures;
  highlights: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceCents: 0,
    tagline: "Pour trouver ton idée et faire tes premiers pas.",
    limits: {
      bookingsPerMonth: 5,
      members: 1,
      customers: 20,
      products: 1,
      toolRunsPerMonth: 3,
      aiRunsPerDay: 3,
    },
    features: {
      emailNotifications: false,
      automaticReminders: false,
      advancedStats: false,
      bookingPageCustomization: false,
      onlineMeetings: false,
    },
    highlights: [
      "Trouver une idée de business",
      "Les 3 premières leçons de l'Académie",
      "3 propositions par mois (analyse, stratégie, pub, contenus)",
      "1 produit",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceCents: 999,
    tagline: "Pour passer à l'action et faire tes premières ventes.",
    limits: {
      bookingsPerMonth: null,
      members: 2,
      customers: null,
      products: 10,
      toolRunsPerMonth: null,
      aiRunsPerDay: 15,
    },
    features: {
      emailNotifications: true,
      automaticReminders: true,
      advancedStats: false,
      bookingPageCustomization: false,
      onlineMeetings: true,
    },
    highlights: [
      "L'Académie débutant complète",
      "Stratégie 30 jours et plan d'action : 3 actions par jour",
      "Publicités, contenus et optimisation des ventes illimités",
      "Objectif « rentabiliser mon abonnement » suivi chaque mois",
      "10 produits",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 2499,
    tagline: "Pour accélérer quand tes premières ventes arrivent.",
    limits: {
      bookingsPerMonth: null,
      members: 10,
      customers: null,
      products: 50,
      toolRunsPerMonth: null,
      aiRunsPerDay: 30,
    },
    features: {
      emailNotifications: true,
      automaticReminders: true,
      advancedStats: true,
      bookingPageCustomization: true,
      onlineMeetings: true,
    },
    highlights: [
      "Tout le forfait Starter",
      "Les modules avancés de l'Académie (publicité payante, augmenter ses prix, fidéliser)",
      "50 produits",
      "Jusqu'à 10 membres",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    priceCents: 4999,
    tagline: "Pour ceux qui gèrent plusieurs projets en même temps.",
    limits: {
      bookingsPerMonth: null,
      members: 25,
      customers: null,
      products: 200,
      toolRunsPerMonth: null,
      aiRunsPerDay: 60,
    },
    features: {
      emailNotifications: true,
      automaticReminders: true,
      advancedStats: true,
      bookingPageCustomization: true,
      onlineMeetings: true,
    },
    highlights: [
      "Tout le forfait Pro",
      "200 produits",
      "Jusqu'à 25 membres",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "business"];

/** Le forfait inclut-il tout ce que contient `min` ? (Business inclut Pro, Pro inclut Starter…) */
export function planAtLeast(plan: PlanId, min: PlanId) {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(min);
}

/**
 * Pas d'essai gratuit sur les forfaits payants : le forfait Free sert de découverte, et le
 * premier paiement a lieu dès l'abonnement. Mettre une valeur > 0 pour réactiver un essai.
 */
export const TRIAL_DAYS = 0;

/**
 * Jours d'essai pour un nouvel abonnement : uniquement si l'entreprise n'a JAMAIS eu d'abonnement
 * (statut Stripe encore vide). Une entreprise qui a résilié ne peut pas recommencer un essai.
 */
export function trialDaysFor(subscriptionStatus: string | null | undefined): number {
  return subscriptionStatus ? 0 : TRIAL_DAYS;
}

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) in PLANS ? (id as PlanId) : "free"];
}

/** Abonnement Stripe encore valable ? Sinon l'entreprise retombe sur Free. */
export function effectivePlan(plan: string, subscriptionStatus: string | null | undefined): Plan {
  if (plan === "free") return PLANS.free;
  const ok =
    subscriptionStatus === "active" ||
    subscriptionStatus === "trialing" ||
    subscriptionStatus === "past_due";
  return ok ? getPlan(plan) : PLANS.free;
}

export type LimitKind = "bookings" | "members" | "customers" | "products" | "tools";

export function hasRoom(limit: number | null, current: number, adding = 1): boolean {
  return limit === null || current + adding <= limit;
}

export const LIMIT_MESSAGES: Record<LimitKind, (plan: Plan) => string> = {
  bookings: (p) =>
    `Votre forfait ${p.name} est limité à ${p.limits.bookingsPerMonth} réservations par mois. Passez au forfait Starter pour des réservations illimitées.`,
  members: (p) =>
    `Votre forfait ${p.name} est limité à ${p.limits.members} membre${p.limits.members > 1 ? "s" : ""} (vous compris, invitations en attente incluses). Passez à un forfait supérieur pour agrandir votre équipe.`,
  customers: (p) =>
    `Votre forfait ${p.name} est limité à ${p.limits.customers} clients. Passez au forfait Starter pour des clients illimités.`,
  tools: (p) =>
    `Ton forfait ${p.name} inclut ${p.limits.toolRunsPerMonth} propositions par mois, toutes utilisées. Passe au forfait Starter pour un accès illimité, ou attends le 1er du mois.`,
  products: (p) =>
    `Votre forfait ${p.name} est limité à ${p.limits.products} produit${p.limits.products > 1 ? "s" : ""}. Passez à un forfait supérieur pour en suivre davantage.`,
};

export class PlanLimitError extends Error {
  constructor(
    public readonly kind: LimitKind,
    message: string,
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}
