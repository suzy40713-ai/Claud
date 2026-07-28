import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { isPremium } from "../modules/billing/billing.service.js";

/**
 * Gate les fonctionnalites premium (coach IA, import automatique Strava,
 * alertes push proactives). A utiliser apres requireAuth. Repond 403 avec un
 * code exploitable par le frontend pour afficher un message d'upsell plutot
 * qu'une erreur generique.
 */
export async function requirePremium(req: Request, res: Response, next: NextFunction) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { subscriptionStatus: true, subscriptionCurrentPeriodEnd: true },
  });

  if (!user || !isPremium(user)) {
    res.status(403).json({
      error: "Cette fonctionnalite est reservee a l'abonnement premium.",
      code: "premium_required",
    });
    return;
  }

  next();
}
