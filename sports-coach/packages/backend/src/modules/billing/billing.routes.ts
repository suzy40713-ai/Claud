import { Router } from "express";
import { env } from "../../lib/env.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  createCheckoutSessionUrl,
  createPortalSessionUrl,
  isBillingConfigured,
  isPremium,
} from "./billing.service.js";

export const billingRouter = Router();
billingRouter.use(requireAuth);

billingRouter.get("/status", async (req, res) => {
  if (!isBillingConfigured()) {
    res.json({ configured: false, premium: false, subscriptionStatus: "aucun", currentPeriodEnd: null });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  res.json({
    configured: true,
    premium: isPremium(user),
    subscriptionStatus: user.subscriptionStatus,
    currentPeriodEnd: user.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
  });
});

billingRouter.post("/create-checkout-session", async (req, res) => {
  if (!isBillingConfigured()) {
    res.status(503).json({ error: "L'abonnement premium n'est pas configure sur ce serveur." });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const url = await createCheckoutSessionUrl(user.id, user.email, env.frontendOrigin);
  res.json({ url });
});

billingRouter.post("/create-portal-session", async (req, res) => {
  if (!isBillingConfigured()) {
    res.status(503).json({ error: "L'abonnement premium n'est pas configure sur ce serveur." });
    return;
  }

  try {
    const url = await createPortalSessionUrl(req.userId!, env.frontendOrigin);
    res.json({ url });
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    res.status(statusCode).json({ error: error instanceof Error ? error.message : "Erreur" });
  }
});
