export const SPORTS = ["course_a_pied", "velo"] as const;
export type Sport = (typeof SPORTS)[number];

export const NIVEAUX = ["debutant", "intermediaire", "avance"] as const;
export type Niveau = (typeof NIVEAUX)[number];

export const OBJECTIFS = [
  "perte_de_poids",
  "preparation_course",
  "regularite",
  "performance",
] as const;
export type Objectif = (typeof OBJECTIFS)[number];

export const ACTIVITY_SOURCES = ["fit", "gpx", "tcx", "manuel", "strava"] as const;
export type ActivitySource = (typeof ACTIVITY_SOURCES)[number];

export const SESSION_STATUTS = ["a_faire", "fait", "ajuste", "skip"] as const;
export type SessionStatut = (typeof SESSION_STATUTS)[number];

export interface UserProfileDTO {
  id: string;
  email: string;
  objectif: Objectif | null;
  sportsPratiques: Sport[];
  niveau: Niveau | null;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface InjuryHistoryDTO {
  id: string;
  zone: string;
  type: string;
  dateApprox: string | null;
  notes: string | null;
}

export interface OnboardingPayload {
  sportsPratiques: Sport[];
  niveau: Niveau;
  objectif: Objectif;
  injuries: Array<{
    zone: string;
    type: string;
    dateApprox?: string | null;
    notes?: string | null;
  }>;
}

export interface DailyLogDTO {
  id: string;
  date: string; // YYYY-MM-DD
  sommeil: number; // 1-5
  fatigue: number; // 1-5
  stress: number; // 1-5
}

export interface DailyLogPayload {
  date: string;
  sommeil: number;
  fatigue: number;
  stress: number;
}

export interface ActivityDTO {
  id: string;
  date: string;
  sport: Sport;
  duree: number; // secondes
  distance: number; // metres
  denivele: number | null; // metres
  fcMoyenne: number | null;
  allureMoyenne: number | null; // secondes/km
  sourceFormat: ActivitySource;
}

export interface WeeklyVolumePoint {
  weekStart: string; // YYYY-MM-DD (lundi)
  totalDistance: number; // metres
  totalDuree: number; // secondes
  sessionCount: number;
}

export interface AuthResponse {
  user: UserProfileDTO;
}

export const COACH_ROLES = ["user", "assistant"] as const;
export type CoachRole = (typeof COACH_ROLES)[number];

export interface CoachMessageDTO {
  id: string;
  role: CoachRole;
  content: string;
  createdAt: string;
}

export const PLANNED_SESSION_TYPES = [
  "endurance_fondamentale",
  "fractionne",
  "seuil",
  "sortie_longue",
  "recuperation",
] as const;
export type PlannedSessionType = (typeof PLANNED_SESSION_TYPES)[number];

export const INTENSITES = ["faible", "moderee", "elevee"] as const;
export type Intensite = (typeof INTENSITES)[number];

export interface PlannedSessionSuggestionDTO {
  raison: string;
  dureeCibleProposee: number; // secondes
  intensiteCibleProposee: Intensite;
}

export interface PlannedSessionDTO {
  id: string;
  date: string; // YYYY-MM-DD
  sport: Sport;
  type: PlannedSessionType;
  dureeCible: number; // secondes
  intensiteCible: Intensite;
  statut: SessionStatut;
  raisonAjustement: string | null;
  suggestion: PlannedSessionSuggestionDTO | null;
}

export interface TrainingPlanDTO {
  id: string;
  semaineDebut: string; // YYYY-MM-DD (lundi)
  seances: PlannedSessionDTO[];
}

export const ACWR_NIVEAUX_RISQUE = [
  "donnees_insuffisantes",
  "sous_charge",
  "optimal",
  "modere",
  "eleve",
] as const;
export type AcwrNiveauRisque = (typeof ACWR_NIVEAUX_RISQUE)[number];

export interface AcwrDTO {
  chargeAigueMin: number; // minutes, 7 derniers jours
  chargeChroniqueMin: number; // minutes/semaine, moyenne sur 28 jours
  ratio: number | null;
  niveauRisque: AcwrNiveauRisque;
  explication: string;
}

export interface TrainingPlanResponse {
  plan: TrainingPlanDTO;
  acwr: AcwrDTO;
}

export const SUBSCRIPTION_STATUSES = ["aucun", "actif", "impaye", "annule"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface BillingStatusDTO {
  configured: boolean;
  premium: boolean;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
}
