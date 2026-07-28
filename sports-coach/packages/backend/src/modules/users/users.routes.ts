import { Router } from "express";
import { z } from "zod";
import { NIVEAUX, OBJECTIFS, SPORTS } from "@sports-coach/shared";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { toUserProfileDTO } from "./users.mapper.js";

export const usersRouter = Router();
usersRouter.use(requireAuth);

const onboardingSchema = z.object({
  sportsPratiques: z.array(z.enum(SPORTS)).min(1, "Selectionne au moins un sport"),
  niveau: z.enum(NIVEAUX),
  objectif: z.enum(OBJECTIFS),
  injuries: z
    .array(
      z.object({
        zone: z.string().min(1),
        type: z.string().min(1),
        dateApprox: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .default([]),
});

usersRouter.post("/onboarding", async (req, res) => {
  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Requete invalide" });
    return;
  }
  const { sportsPratiques, niveau, objectif, injuries } = parsed.data;
  const userId = req.userId!;

  const user = await prisma.$transaction(async (tx) => {
    if (injuries.length > 0) {
      await tx.injuryHistory.deleteMany({ where: { userId } });
      await tx.injuryHistory.createMany({
        data: injuries.map((injury) => ({
          userId,
          zone: injury.zone,
          type: injury.type,
          dateApprox: injury.dateApprox ? new Date(injury.dateApprox) : null,
          notes: injury.notes ?? null,
        })),
      });
    }

    return tx.user.update({
      where: { id: userId },
      data: {
        sportsPratiques,
        niveau,
        objectif,
        onboardingComplete: true,
      },
    });
  });

  res.json({ user: toUserProfileDTO(user) });
});

usersRouter.get("/injuries", async (req, res) => {
  const injuries = await prisma.injuryHistory.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "asc" },
  });
  res.json({
    injuries: injuries.map((injury) => ({
      id: injury.id,
      zone: injury.zone,
      type: injury.type,
      dateApprox: injury.dateApprox?.toISOString() ?? null,
      notes: injury.notes,
    })),
  });
});
