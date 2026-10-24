import { Router } from "express";
import { env } from "../../lib/env.js";
import {
  createFormationCheckoutSessionUrl,
  FORMATION_PDF_FILENAME,
  FORMATION_PDF_PATH,
  getFormationContent,
  handleFormationCheckoutCompleted,
  isFormationCheckoutConfigured,
  isFormationCheckoutSession,
  retrieveCheckoutSession,
  signFormationAccess,
  verifyFormationAccess,
} from "./formation.service.js";

// Achat sans compte requis (comme l'ancien ebookRouter) : pas de requireAuth.
export const formationRouter = Router();

formationRouter.get("/status", (_req, res) => {
  res.json({ configured: isFormationCheckoutConfigured(), priceCents: env.formationPriceCents, currency: "eur" });
});

formationRouter.post("/create-checkout-session", async (req, res) => {
  if (!isFormationCheckoutConfigured()) {
    res.status(503).json({ error: "Le paiement n'est pas encore active sur ce site." });
    return;
  }
  if (req.body?.waiver !== true) {
    res.status(400).json({ error: "Coche la case d'acces immediat pour continuer." });
    return;
  }
  res.json({ url: await createFormationCheckoutSessionUrl() });
});

// Appele par la page /merci au retour de Stripe : verifie le paiement et renvoie le lien d'acces.
formationRouter.get("/confirm", async (req, res) => {
  const sessionId = String(req.query.session_id ?? "");
  if (!isFormationCheckoutConfigured() || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    res.status(400).json({ error: "Session de paiement invalide." });
    return;
  }
  const session = await retrieveCheckoutSession(sessionId);
  if (!isFormationCheckoutSession(session)) {
    res.status(400).json({ error: "Cette session ne correspond pas a la formation." });
    return;
  }
  if (session.payment_status !== "paid") {
    res.status(402).json({ error: "Paiement pas encore confirme. Recharge la page dans quelques instants." });
    return;
  }
  await handleFormationCheckoutCompleted(session);
  res.json({ token: signFormationAccess(session.id), email: session.customer_details?.email ?? null });
});

formationRouter.get("/content", (req, res) => {
  if (!verifyFormationAccess(req.query.acces)) {
    res.status(403).json({ error: "Lien d'acces non valide." });
    return;
  }
  res.set("Cache-Control", "private, no-store");
  res.json(getFormationContent());
});

formationRouter.get("/pdf", (req, res) => {
  if (!verifyFormationAccess(req.query.acces)) {
    res.status(403).json({ error: "Lien d'acces non valide." });
    return;
  }
  res.download(FORMATION_PDF_PATH, FORMATION_PDF_FILENAME);
});
