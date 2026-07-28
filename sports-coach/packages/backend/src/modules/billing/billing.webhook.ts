import { Router } from "express";
import express from "express";
import { constructWebhookEvent, handleWebhookEvent, isWebhookConfigured } from "./billing.service.js";

/**
 * Route webhook Stripe isolee de billingRouter : elle n'utilise pas
 * requireAuth (l'appelant est Stripe, pas un utilisateur connecte) et doit
 * recevoir le corps brut de la requete pour verifier la signature, donc elle
 * doit etre montee AVANT express.json() dans server.ts.
 */
export const billingWebhookRouter = Router();

billingWebhookRouter.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  if (!isWebhookConfigured()) {
    res.status(503).json({ error: "STRIPE_WEBHOOK_SECRET non configure." });
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string") {
    res.status(400).json({ error: "Signature Stripe manquante." });
    return;
  }

  try {
    const event = constructWebhookEvent(req.body as Buffer, signature);
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error("Verification du webhook Stripe echouee:", error);
    res.status(400).json({ error: "Webhook invalide." });
  }
});
