/**
 * Catalogue des automatisations BookSync Autopilot — source unique de vérité (logique pure).
 * Chaque automatisation a un forfait minimal, un état par défaut, et peut être « verrouillée »
 * quand il s'agit d'une protection de sécurité qu'on ne doit jamais désactiver.
 */
import { PLAN_ORDER, type PlanId } from "@/domain/billing/plans";

export type AutomationKey =
  | "booking_confirmation"
  | "cancellation_notice"
  | "reminder_24h"
  | "reminder_2h"
  | "staff_alerts"
  | "waitlist"
  | "daily_summary"
  | "calendar_sync"
  | "conflict_protection";

export type AutomationDefinition = {
  key: AutomationKey;
  title: string;
  description: string;
  minPlan: PlanId;
  defaultEnabled: boolean;
  /** Protection permanente : toujours active, non désactivable. */
  locked?: boolean;
  category: "clients" | "equipe" | "agenda";
};

export const AUTOMATIONS: readonly AutomationDefinition[] = [
  {
    key: "booking_confirmation",
    title: "Confirmation automatique",
    description:
      "Email envoyé au client dès la réservation et à chaque changement d'horaire, avec son lien pour gérer le rendez-vous.",
    minPlan: "starter",
    defaultEnabled: true,
    category: "clients",
  },
  {
    key: "cancellation_notice",
    title: "Notification d'annulation",
    description: "Email envoyé au client quand son rendez-vous est annulé.",
    minPlan: "starter",
    defaultEnabled: true,
    category: "clients",
  },
  {
    key: "reminder_24h",
    title: "Rappel 24 heures avant",
    description: "Réduit fortement les rendez-vous oubliés.",
    minPlan: "starter",
    defaultEnabled: true,
    category: "clients",
  },
  {
    key: "reminder_2h",
    title: "Rappel 2 heures avant",
    description: "Un dernier rappel le jour même.",
    minPlan: "starter",
    defaultEnabled: true,
    category: "clients",
  },
  {
    key: "waitlist",
    title: "Liste d'attente intelligente",
    description:
      "Quand un rendez-vous est annulé, le créneau est proposé par email aux clients en attente compatibles. Le premier qui confirme l'obtient ; les propositions expirent au bout de 2 heures.",
    minPlan: "pro",
    defaultEnabled: true,
    category: "clients",
  },
  {
    key: "staff_alerts",
    title: "Alertes de l'équipe",
    description:
      "Prévient l'employé concerné, le propriétaire et les administrateurs à chaque réservation, modification ou annulation (par email à partir du forfait Starter).",
    minPlan: "free",
    defaultEnabled: true,
    category: "equipe",
  },
  {
    key: "daily_summary",
    title: "Résumé quotidien",
    description:
      "Chaque soir à 19 h, un email au propriétaire et aux administrateurs : rendez-vous du lendemain, créneaux encore libres, annulations récentes, liste d'attente et actions d'Autopilot.",
    minPlan: "pro",
    defaultEnabled: true,
    category: "equipe",
  },
  {
    key: "calendar_sync",
    title: "Mise à jour du calendrier",
    description:
      "Chaque réservation, modification ou annulation apparaît instantanément dans le calendrier et libère ou bloque le créneau.",
    minPlan: "free",
    defaultEnabled: true,
    locked: true,
    category: "agenda",
  },
  {
    key: "conflict_protection",
    title: "Détection des conflits",
    description:
      "Deux rendez-vous ne peuvent jamais se chevaucher pour un même employé : la base de données refuse toute double réservation.",
    minPlan: "free",
    defaultEnabled: true,
    locked: true,
    category: "agenda",
  },
];

export const AUTOMATION_KEYS = AUTOMATIONS.map((a) => a.key);

export function isAutomationKey(value: unknown): value is AutomationKey {
  return typeof value === "string" && (AUTOMATION_KEYS as string[]).includes(value);
}

export function getAutomation(key: AutomationKey): AutomationDefinition {
  return AUTOMATIONS.find((a) => a.key === key)!;
}

export function planIncludes(plan: PlanId, minPlan: PlanId) {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(minPlan);
}

export type StoredRules = Partial<Record<AutomationKey, boolean>>;

/** État effectif : verrouillée → active ; forfait insuffisant → inactive ; sinon choix enregistré ou défaut. */
export function isAutomationActive(key: AutomationKey, plan: PlanId, stored: StoredRules) {
  const def = getAutomation(key);
  if (def.locked) return true;
  if (!planIncludes(plan, def.minPlan)) return false;
  return stored[key] ?? def.defaultEnabled;
}

export type AutomationState = AutomationDefinition & {
  active: boolean;
  /** Choix du professionnel (indépendant du forfait) */
  enabled: boolean;
  includedInPlan: boolean;
};

export function resolveAutomations(plan: PlanId, stored: StoredRules): AutomationState[] {
  return AUTOMATIONS.map((def) => ({
    ...def,
    enabled: def.locked ? true : (stored[def.key] ?? def.defaultEnabled),
    includedInPlan: planIncludes(plan, def.minPlan),
    active: isAutomationActive(def.key, plan, stored),
  }));
}
