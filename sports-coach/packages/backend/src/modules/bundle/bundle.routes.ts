import { Router } from "express";
import { env } from "../../lib/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import { BUNDLE_PRICE_CENTS, createBundleCheckoutSessionUrl, isBundleCheckoutConfigured } from "./bundle.service.js";

// Contrairement a ebookRouter, le Pack Complet accorde du Premium sur un
// compte : il faut donc etre connecte pour l'acheter.
export const bundleRouter = Router();
bundleRouter.use(requireAuth);

bundleRouter.get("/status", (_req, res) => {
  res.json({
    configured: isBundleCheckoutConfigured(),
    priceCents: BUNDLE_PRICE_CENTS,
  });
});

bundleRouter.post("/create-checkout-session", async (req, res) => {
  if (!isBundleCheckoutConfigured()) {
    res.status(503).json({ error: "Le Pack Complet n'est pas configure sur ce serveur." });
    return;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  const url = await createBundleCheckoutSessionUrl(user.id, user.email, env.frontendOrigin);
  res.json({ url });
});
