import { Router } from "express";
import { z } from "zod";
import { env } from "../../lib/env.js";
import { isPushConfigured } from "../../lib/push.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { requirePremium } from "../../middleware/premium.js";
import { checkAndNotifyOverloadRisk } from "./overload-check.js";

export const pushRouter = Router();
pushRouter.use(requireAuth);

pushRouter.get("/vapid-public-key", (_req, res) => {
  if (!isPushConfigured()) {
    res.status(503).json({ error: "Les notifications push ne sont pas configurees sur ce serveur." });
    return;
  }
  res.json({ publicKey: env.vapidPublicKey });
});

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

pushRouter.post("/subscribe", requirePremium, async (req, res) => {
  const parsed = subscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Abonnement invalide" });
    return;
  }

  const { endpoint, keys } = parsed.data;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: req.userId!, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { userId: req.userId!, p256dh: keys.p256dh, auth: keys.auth },
  });

  res.status(201).json({ ok: true });
});

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

pushRouter.delete("/subscribe", async (req, res) => {
  const parsed = unsubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Endpoint invalide" });
    return;
  }
  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: req.userId },
  });
  res.status(204).send();
});

pushRouter.post("/check-now", requirePremium, async (req, res) => {
  if (!isPushConfigured()) {
    res.status(503).json({ error: "Les notifications push ne sont pas configurees sur ce serveur." });
    return;
  }
  const sent = await checkAndNotifyOverloadRisk(req.userId!, { ignoreThrottle: true });
  res.json({ sent });
});
