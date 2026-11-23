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
    /** Générations IA par mois (analyses, stratégies, publicités, contenus, assistant). */
    aiGenerationsPerMonth: number;
  };
  features: PlanFeatures;
  highlights: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceCents: 0,
    tagline: "Pour découvrir BookSync.",
    limits: {
      bookingsPerMonth: 5,
      members: 1,
      customers: 20,
      products: 1,
      aiGenerationsPerMonth: 10,
    },
    features: {
      emailNotifications: false,
      automaticReminders: false,
      advancedStats: false,
      bookingPageCustomization: false,
      onlineMeetings: false,
    },
    highlights: [
      "1 produit suivi par le copilote",
      "10 générations IA par mois (analyse, stratégie, contenus…)",
      "Autopilot marketing et statistiques",
      "Module rendez-vous : 5 réservations par mois, 20 clients",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceCents: 999,
    tagline: "Pour les indépendants qui se lancent.",
    limits: {
      bookingsPerMonth: null,
      members: 2,
      customers: null,
      products: 10,
      aiGenerationsPerMonth: 100,
    },
    features: {
      emailNotifications: true,
      automaticReminders: true,
      advancedStats: false,
      bookingPageCustomization: false,
      onlineMeetings: true,
    },
    highlights: [
      "10 produits suivis",
      "100 générations IA par mois",
      "Stratégie 30 jours, publicités, contenus, Sales Booster",
      "Module rendez-vous : réservations et clients illimités",
      "Confirmations et rappels automatiques, visio",
      "Visibilité dans l'annuaire BookSync",
      "2 membres",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 2499,
    tagline: "Pour les équipes qui veulent tout automatiser.",
    limits: {
      bookingsPerMonth: null,
      members: 10,
      customers: null,
      products: 50,
      aiGenerationsPerMonth: 400,
    },
    features: {
      emailNotifications: true,
      automaticReminders: true,
      advancedStats: true,
      bookingPageCustomization: true,
      onlineMeetings: true,
    },
    highlights: [
      "50 produits suivis",
      "400 générations IA par mois",
      "Tout le forfait Starter, jusqu'à 10 membres",
      "Assistant BookSync (produits, Autopilot, rendez-vous)",
      "Liste d'attente intelligente",
      "Statistiques avancées et recommandations",
      "Résumé quotidien par email",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    priceCents: 4999,
    tagline: "Pour les entreprises qui vendent beaucoup de produits.",
    limits: {
      bookingsPerMonth: null,
      members: 25,
      customers: null,
      products: 200,
      aiGenerationsPerMonth: 1000,
    },
    features: {
      emailNotifications: true,
      automaticReminders: true,
      advancedStats: true,
      bookingPageCustomization: true,
      onlineMeetings: true,
    },
    highlights: [
      "200 produits suivis",
      "1 000 générations IA par mois",
      "Tout le forfait Pro, jusqu'à 25 membres",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "business"];

/** Le forfait inclut-il tout ce que contient `min` ? (Business inclut Pro, Pro inclut Starter…) */
export function planAtLeast(plan: PlanId, min: PlanId) {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(min);
}

/** Essai gratuit offert au premier abonnement payant (carte enregistrée, aucun prélèvement). */
export const TRIAL_DAYS = 30;

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

export type LimitKind = "bookings" | "members" | "customers" | "products" | "ai";

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
  products: (p) =>
    `Votre forfait ${p.name} est limité à ${p.limits.products} produit${p.limits.products > 1 ? "s" : ""}. Passez à un forfait supérieur pour en suivre davantage.`,
  ai: (p) =>
    `Vous avez utilisé les ${p.limits.aiGenerationsPerMonth} générations IA incluses ce mois-ci dans le forfait ${p.name}. Elles se renouvellent le 1er du mois, ou passez à un forfait supérieur.`,
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
