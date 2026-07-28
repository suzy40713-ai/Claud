import { Router } from "express";
import { z } from "zod";
import type { Intensite } from "@sports-coach/shared";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { computeAcwr } from "./acwr.js";
import { generateWeeklySessions, mondayOfCurrentWeek } from "./plan-generator.js";
import { computeSuggestion } from "./suggestion.js";
import { toPlannedSessionDTO, toTrainingPlanDTO } from "./training-plan.mapper.js";
import { checkAndNotifyOverloadRisk } from "../push/overload-check.js";

export const trainingPlanRouter = Router();
trainingPlanRouter.use(requireAuth);

const DAILY_LOG_LOOKBACK_DAYS = 7;
const ACTIVITY_LOOKBACK_DAYS = 28;

async function getOrCreateCurrentPlan(userId: string) {
  const semaineDebut = mondayOfCurrentWeek();

  const existing = await prisma.trainingPlan.findUnique({
    where: { userId_semaineDebut: { userId, semaineDebut } },
    include: { seances: true },
  });
  if (existing) return existing;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.objectif || !user.niveau) {
    throw Object.assign(new Error("Termine ton profil (objectif et niveau) pour generer un plan."), {
      statusCode: 422,
    });
  }

  const sessions = generateWeeklySessions({
    objectif: user.objectif,
    niveau: user.niveau,
    sportsPratiques: user.sportsPratiques,
    semaineDebut,
  });

  return prisma.trainingPlan.create({
    data: {
      userId,
      semaineDebut,
      seances: { create: sessions },
    },
    include: { seances: true },
  });
}

trainingPlanRouter.get("/", async (req, res) => {
  const userId = req.userId!;

  let plan;
  try {
    plan = await getOrCreateCurrentPlan(userId);
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    res.status(statusCode).json({ error: error instanceof Error ? error.message : "Erreur" });
    return;
  }

  const dailyLogSince = new Date();
  dailyLogSince.setDate(dailyLogSince.getDate() - DAILY_LOG_LOOKBACK_DAYS);
  const activitySince = new Date();
  activitySince.setDate(activitySince.getDate() - ACTIVITY_LOOKBACK_DAYS);

  const [recentLogs, recentActivities] = await Promise.all([
    prisma.dailyLog.findMany({ where: { userId, date: { gte: dailyLogSince } } }),
    prisma.activity.findMany({ where: { userId, date: { gte: activitySince } } }),
  ]);

  res.json({
    plan: toTrainingPlanDTO(plan, recentLogs),
    acwr: computeAcwr(recentActivities),
  });

  checkAndNotifyOverloadRisk(userId).catch((error) => {
    console.error("Erreur lors de la verification de surcharge:", error);
  });
});

const updateStatutSchema = z.object({
  statut: z.enum(["a_faire", "fait", "skip"]),
});

trainingPlanRouter.patch("/sessions/:id", async (req, res) => {
  const parsed = updateStatutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Requete invalide" });
    return;
  }

  const session = await prisma.plannedSession.findUnique({
    where: { id: req.params.id },
    include: { plan: true },
  });
  if (!session || session.plan.userId !== req.userId) {
    res.status(404).json({ error: "Seance introuvable" });
    return;
  }

  const updated = await prisma.plannedSession.update({
    where: { id: session.id },
    data: { statut: parsed.data.statut },
  });

  const dailyLogSince = new Date();
  dailyLogSince.setDate(dailyLogSince.getDate() - DAILY_LOG_LOOKBACK_DAYS);
  const recentLogs = await prisma.dailyLog.findMany({
    where: { userId: req.userId, date: { gte: dailyLogSince } },
  });

  res.json({ seance: toPlannedSessionDTO(updated, recentLogs) });
});

trainingPlanRouter.post("/sessions/:id/apply-suggestion", async (req, res) => {
  const session = await prisma.plannedSession.findUnique({
    where: { id: req.params.id },
    include: { plan: true },
  });
  if (!session || session.plan.userId !== req.userId) {
    res.status(404).json({ error: "Seance introuvable" });
    return;
  }

  const dailyLogSince = new Date();
  dailyLogSince.setDate(dailyLogSince.getDate() - DAILY_LOG_LOOKBACK_DAYS);
  const recentLogs = await prisma.dailyLog.findMany({
    where: { userId: req.userId, date: { gte: dailyLogSince } },
  });

  const suggestion = computeSuggestion(
    { ...session, intensiteCible: session.intensiteCible as Intensite },
    recentLogs
  );
  if (!suggestion) {
    res.status(409).json({ error: "Cette suggestion n'est plus applicable." });
    return;
  }

  const updated = await prisma.plannedSession.update({
    where: { id: session.id },
    data: {
      dureeCible: suggestion.dureeCibleProposee,
      intensiteCible: suggestion.intensiteCibleProposee,
      statut: "ajuste",
      raisonAjustement: suggestion.raison,
    },
  });

  res.json({ seance: toPlannedSessionDTO(updated, recentLogs) });
});
