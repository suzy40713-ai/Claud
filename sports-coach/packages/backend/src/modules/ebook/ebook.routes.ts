import { Router, type Request } from "express";
import { env } from "../../lib/env.js";
import { createEbookCheckoutSessionUrl, EBOOK_PRODUCTS, getEbookProduct, isEbookCheckoutConfigured } from "./ebook.service.js";

// Achat de l'ebook sans compte requis : pas de requireAuth ici, contrairement
// a billingRouter (abonnement de l'app).
export const ebookRouter = Router();

function resolveProductId(req: Request): string {
  const raw = req.query.product ?? req.body?.product;
  return typeof raw === "string" && raw in EBOOK_PRODUCTS ? raw : "transformation-90-jours";
}

ebookRouter.get("/status", (req, res) => {
  const product = getEbookProduct(resolveProductId(req));
  res.json({
    configured: isEbookCheckoutConfigured(),
    priceCents: product.priceCents,
    compareAtPriceCents: product.compareAtPriceCents,
  });
});

ebookRouter.post("/create-checkout-session", async (req, res) => {
  if (!isEbookCheckoutConfigured()) {
    res.status(503).json({ error: "L'achat de l'ebook n'est pas configure sur ce serveur." });
    return;
  }

  const productId = resolveProductId(req);
  const url = await createEbookCheckoutSessionUrl(env.frontendOrigin, productId);
  res.json({ url });
});
