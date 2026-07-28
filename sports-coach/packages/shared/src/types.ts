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

export const ACTIVITY_SOURCES = ["fit", "gpx", "tcx", "manuel"] as const;
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
