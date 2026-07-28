import { Router } from "express";
import { z } from "zod";
import type { DailyLog } from "@prisma/client";
import type { DailyLogDTO } from "@sports-coach/shared";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";

export const dailyLogRouter = Router();
dailyLogRouter.use(requireAuth);

const dailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (attendu YYYY-MM-DD)"),
  sommeil: z.number().int().min(1).max(5),
  fatigue: z.number().int().min(1).max(5),
  stress: z.number().int().min(1).max(5),
});

function toDTO(log: DailyLog): DailyLogDTO {
  return {
    id: log.id,
    date: log.date.toISOString().slice(0, 10),
    sommeil: log.sommeil,
    fatigue: log.fatigue,
    stress: log.stress,
  };
}

dailyLogRouter.post("/", async (req, res) => {
  const parsed = dailyLogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Requete invalide" });
    return;
  }
  const { date, sommeil, fatigue, stress } = parsed.data;
  const userId = req.userId!;

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId, date: new Date(date) } },
    create: { userId, date: new Date(date), sommeil, fatigue, stress },
    update: { sommeil, fatigue, stress },
  });

  res.json({ log: toDTO(log) });
});

dailyLogRouter.get("/", async (req, res) => {
  const days = Math.min(Number(req.query.days ?? 14), 90);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const logs = await prisma.dailyLog.findMany({
    where: { userId: req.userId, date: { gte: since } },
    orderBy: { date: "desc" },
  });

  res.json({ logs: logs.map(toDTO) });
});

dailyLogRouter.get("/today", async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const log = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId: req.userId!, date: new Date(today) } },
  });
  res.json({ log: log ? toDTO(log) : null });
});
