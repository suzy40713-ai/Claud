import type { DailyLog, PlannedSession, TrainingPlan } from "@prisma/client";
import type {
  Intensite,
  PlannedSessionDTO,
  PlannedSessionType,
  TrainingPlanDTO,
} from "@sports-coach/shared";
import { computeSuggestion } from "./suggestion.js";

export function toPlannedSessionDTO(
  session: PlannedSession,
  recentLogs: DailyLog[]
): PlannedSessionDTO {
  return {
    id: session.id,
    date: session.date.toISOString().slice(0, 10),
    sport: session.sport,
    type: session.type as PlannedSessionType,
    dureeCible: session.dureeCible,
    intensiteCible: session.intensiteCible as Intensite,
    statut: session.statut,
    raisonAjustement: session.raisonAjustement,
    suggestion: computeSuggestion(
      { ...session, intensiteCible: session.intensiteCible as Intensite },
      recentLogs
    ),
  };
}

export function toTrainingPlanDTO(
  plan: TrainingPlan & { seances: PlannedSession[] },
  recentLogs: DailyLog[]
): TrainingPlanDTO {
  return {
    id: plan.id,
    semaineDebut: plan.semaineDebut.toISOString().slice(0, 10),
    seances: plan.seances
      .slice()
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((s) => toPlannedSessionDTO(s, recentLogs)),
  };
}
