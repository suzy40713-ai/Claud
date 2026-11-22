/**
 * Forfaits BookSync et leurs limites. Toute vérification de limite côté serveur passe par ici.
 * Les PRIX se configurent ici (`priceCents`) : au déploiement suivant, BookSync crée lui-même le
 * nouveau prix dans Stripe et l'utilise pour les nouveaux abonnements (voir billing/stripe.ts).
 */

export type PlanId = "free" | "starter" | "pro";

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
  limits: { bookingsPerMonth: number | null; members: number; customers: number | null };
  features: PlanFeatures;
  highlights: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceCents: 0,
    tagline: "Pour découvrir BookSync.",
    limits: { bookingsPerMonth: 5, members: 1, customers: 20 },
    features: {
      emailNotifications: false,
      automaticReminders: false,
      advancedStats: false,
      bookingPageCustomization: false,
      onlineMeetings: false,
    },
    highlights: [
      "5 réservations par mois",
      "1 employé",
      "20 clients",
      "Page de réservation en ligne",
      "Statistiques basiques",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceCents: 999,
    tagline: "Pour les indépendants qui se lancent.",
    limits: { bookingsPerMonth: null, members: 2, customers: null },
    features: {
      emailNotifications: true,
      automaticReminders: true,
      advancedStats: false,
      bookingPageCustomization: false,
      onlineMeetings: true,
    },
    highlights: [
      "Gestion des rendez-vous et agenda professionnel",
      "Réservations en ligne illimitées",
      "Visibilité dans l'annuaire BookSync",
      "Confirmations et rappels automatiques",
      "Rendez-vous en visio (lien Meet ou Zoom envoyé au client)",
      "Gestion des clients illimitée",
      "2 employés",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceCents: 2499,
    tagline: "Pour les équipes qui veulent tout automatiser.",
    limits: { bookingsPerMonth: null, members: 10, customers: null },
    features: {
      emailNotifications: true,
      automaticReminders: true,
      advancedStats: true,
      bookingPageCustomization: true,
      onlineMeetings: true,
    },
    highlights: [
      "Réservations illimitées",
      "10 employés",
      "Clients illimités",
      "Tout le forfait Starter, jusqu'à 10 employés",
      "Liste d'attente intelligente",
      "Statistiques avancées et recommandations",
      "Résumé quotidien par email",
      "Automatisations avancées et page personnalisée",
      "Assistant BookSync AI (bientôt disponible)",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "starter", "pro"];

/** Essai gratuit offert au premier abonnement Starter ou Pro (carte enregistrée, aucun prélèvement). */
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

export type LimitKind = "bookings" | "members" | "customers";

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
