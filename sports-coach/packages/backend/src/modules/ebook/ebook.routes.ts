import { Router } from "express";
import { env } from "../../lib/env.js";
import { createEbookCheckoutSessionUrl, isEbookCheckoutConfigured } from "./ebook.service.js";

// Achat de l'ebook sans compte requis : pas de requireAuth ici, contrairement
// a billingRouter (abonnement de l'app).
export const ebookRouter = Router();

ebookRouter.get("/status", (_req, res) => {
  res.json({
    configured: isEbookCheckoutConfigured(),
    priceCents: env.ebookPriceCents,
    compareAtPriceCents: env.ebookCompareAtPriceCents,
  });
});

ebookRouter.post("/create-checkout-session", async (_req, res) => {
  if (!isEbookCheckoutConfigured()) {
    res.status(503).json({ error: "L'achat de l'ebook n'est pas configure sur ce serveur." });
    return;
  }

  const url = await createEbookCheckoutSessionUrl(env.frontendOrigin);
  res.json({ url });
});
