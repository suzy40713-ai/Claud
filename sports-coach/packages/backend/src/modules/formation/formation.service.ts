import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";
import { env } from "../../lib/env.js";
import { prisma } from "../../lib/prisma.js";
import { isEmailConfigured, sendFormationAccessEmail } from "../../lib/email.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, "..", "..", "..", "formation-assets");

export const FORMATION_PRODUCT_ID = "studio-cartoon";
export const FORMATION_PDF_PATH = path.join(ASSETS_DIR, "studio-cartoon-formation.pdf");
export const FORMATION_PDF_FILENAME = "Studio-Cartoon-Formation.pdf";
const FORMATION_NAME = "Formation Studio Cartoon";
const FORMATION_DESCRIPTION =
  "13 modules, 59 lecons, 55 exercices, 20 scripts complets et le cahier PDF pour creer des sketchs animes.";

// Le contenu complet n'est jamais embarque dans le site statique : il est servi ici, uniquement aux acheteurs.
let contentCache: unknown = null;
export function getFormationContent(): unknown {
  if (!contentCache) {
    contentCache = JSON.parse(readFileSync(path.join(ASSETS_DIR, "formation-content.json"), "utf8"));
  }
  return contentCache;
}

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw Object.assign(new Error("STRIPE_SECRET_KEY non configure."), { statusCode: 503 });
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}

export function isFormationCheckoutConfigured(): boolean {
  return Boolean(env.stripeSecretKey);
}

// Lien d'acces = identifiant de la session Stripe signe (HMAC) : pas de compte a creer pour l'acheteur.
export function signFormationAccess(sessionId: string): string {
  const sig = crypto.createHmac("sha256", `formation:${env.jwtSecret}`).update(sessionId).digest("base64url");
  return `${sessionId}.${sig}`;
}

export function verifyFormationAccess(token: unknown): boolean {
  if (typeof token !== "string") return false;
  const i = token.lastIndexOf(".");
  if (i <= 0) return false;
  const expected = Buffer.from(signFormationAccess(token.slice(0, i)));
  const given = Buffer.from(token);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export function formationAccessUrl(token: string): string {
  return `${env.frontendOrigin}/formation?acces=${encodeURIComponent(token)}`;
}

export async function createFormationCheckoutSessionUrl(): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: env.formationPriceCents,
          product_data: { name: FORMATION_NAME, description: FORMATION_DESCRIPTION },
        },
      },
    ],
    success_url: `${env.frontendOrigin}/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.frontendOrigin}/#acheter`,
    metadata: { product: FORMATION_PRODUCT_ID, waiver_immediate_access: "accepted" },
  });
  if (!session.url) {
    throw new Error("Stripe n'a pas renvoye d'URL de paiement.");
  }
  return session.url;
}

export async function retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.retrieve(sessionId);
}

export function isFormationCheckoutSession(session: Stripe.Checkout.Session): boolean {
  return session.mode === "payment" && session.metadata?.product === FORMATION_PRODUCT_ID;
}

/**
 * Enregistre l'achat (idempotent sur l'ID de session : appele par le webhook ET par la page /merci)
 * puis envoie le lien d'acces et le PDF par email, une seule fois.
 */
export async function handleFormationCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== "paid") return;
  const email = session.customer_details?.email ?? session.customer_email;
  if (!email) {
    console.error(`Achat formation sans email recupere sur la session Stripe ${session.id}`);
    return;
  }

  const purchase = await prisma.ebookPurchase.upsert({
    where: { stripeSessionId: session.id },
    update: {},
    create: {
      email,
      product: FORMATION_PRODUCT_ID,
      stripeSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      amountTotal: session.amount_total ?? env.formationPriceCents,
    },
  });
  if (purchase.deliveryStatus === "envoye") return;

  if (!isEmailConfigured()) {
    await prisma.ebookPurchase.update({
      where: { id: purchase.id },
      data: { deliveryStatus: "echec", deliveryError: "RESEND_API_KEY non configure" },
    });
    return;
  }
  try {
    await sendFormationAccessEmail(email, {
      accessUrl: formationAccessUrl(signFormationAccess(session.id)),
      pdfPath: FORMATION_PDF_PATH,
      downloadFilename: FORMATION_PDF_FILENAME,
    });
    await prisma.ebookPurchase.update({
      where: { id: purchase.id },
      data: { deliveryStatus: "envoye", deliveredAt: new Date(), deliveryError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    await prisma.ebookPurchase.update({
      where: { id: purchase.id },
      data: { deliveryStatus: "echec", deliveryError: message },
    });
    console.error(`Achat formation ${purchase.id} : echec de l'envoi de l'email:`, error);
  }
}
