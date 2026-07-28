import type { DailyLog } from "@prisma/client";
import type { Intensite, PlannedSessionSuggestionDTO, SessionStatut } from "@sports-coach/shared";

const LOOKBACK_DAYS = 3;
const FATIGUE_THRESHOLD = 4;
const SOMMEIL_THRESHOLD = 2;
const REDUCTION_FACTOR = 0.7;

const INTENSITE_REDUITE: Record<Intensite, Intensite> = {
  elevee: "moderee",
  moderee: "faible",
  faible: "faible",
};

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Propose (sans jamais l'appliquer automatiquement) un allegement d'une seance
 * a venir si le journal quotidien indique fatigue elevee ou sommeil degrade
 * sur les 3 derniers jours consecutifs.
 */
export function computeSuggestion(
  session: { date: Date; statut: SessionStatut; dureeCible: number; intensiteCible: Intensite },
  recentLogs: DailyLog[]
): PlannedSessionSuggestionDTO | null {
  if (session.statut !== "a_faire") return null;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (session.date < today) return null;

  const logsByDate = new Map(recentLogs.map((l) => [toDateKey(l.date), l]));
  const last3Days = Array.from({ length: LOOKBACK_DAYS }, (_, offset) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - offset);
    return logsByDate.get(toDateKey(d));
  });

  if (last3Days.some((log) => !log)) return null;
  const logs = last3Days as DailyLog[];

  const fatigueElevee = logs.every((l) => l.fatigue >= FATIGUE_THRESHOLD);
  const sommeilDegrade = logs.every((l) => l.sommeil <= SOMMEIL_THRESHOLD);
  if (!fatigueElevee && !sommeilDegrade) return null;

  const raisonBase =
    fatigueElevee && sommeilDegrade
      ? "Ta fatigue est elevee et ton sommeil degrade depuis 3 jours"
      : fatigueElevee
        ? "Ta fatigue est elevee depuis 3 jours"
        : "Ton sommeil est degrade depuis 3 jours";

  const dureeCibleProposee = Math.round((session.dureeCible * REDUCTION_FACTOR) / 60) * 60;

  return {
    raison: `${raisonBase}. Je te propose une seance plus courte et moins intense pour cette fois.`,
    dureeCibleProposee,
    intensiteCibleProposee: INTENSITE_REDUITE[session.intensiteCible],
  };
}
