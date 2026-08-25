import Stripe from "stripe";
import { env } from "../../lib/env.js";
import { prisma } from "../../lib/prisma.js";
import { isEmailConfigured, sendBundleEmail } from "../../lib/email.js";
import { EBOOK_PRODUCTS } from "../ebook/ebook.service.js";

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

export const BUNDLE_METADATA_VALUE = "bundle-complet";
export const BUNDLE_PRICE_CENTS = 10000;
const BUNDLE_PREMIUM_DAYS = 365;

export function isBundleCheckoutConfigured(): boolean {
  return Boolean(env.stripeSecretKey);
}

export async function createBundleCheckoutSessionUrl(
  userId: string,
  email: string,
  frontendOrigin: string
): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: BUNDLE_PRICE_CENTS,
          product_data: {
            name: "Pack Complet Cadenzo",
            description: "Les 6 ebooks Cadenzo + 1 an d'abonnement Premium sur l'app.",
          },
        },
      },
    ],
    success_url: `${frontendOrigin}/pack-complet?checkout=succes`,
    cancel_url: `${frontendOrigin}/pack-complet?checkout=annule`,
    client_reference_id: userId,
    metadata: { product: BUNDLE_METADATA_VALUE, userId },
  });

  if (!session.url) {
    throw new Error("Stripe n'a pas renvoye d'URL de paiement.");
  }
  return session.url;
}

export function isBundleCheckoutSession(session: Stripe.Checkout.Session): boolean {
  return session.mode === "payment" && session.metadata?.product === BUNDLE_METADATA_VALUE;
}

/**
 * Traite un paiement du Pack Complet confirme par Stripe : accorde 1 an de
 * Premium sur le compte, envoie les 6 ebooks par email, et enregistre
 * l'achat (idempotence sur l'ID de session, un webhook peut etre livre
 * plusieurs fois).
 */
export async function handleBundleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.userId ?? session.client_reference_id;
  if (!userId) {
    console.error(`Achat Pack Complet sans userId sur la session Stripe ${session.id}`);
    return;
  }

  const existing = await prisma.bundlePurchase.findUnique({ where: { stripeSessionId: session.id } });
  if (existing) {
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`Achat Pack Complet : utilisateur ${userId} introuvable (session ${session.id})`);
    return;
  }

  await prisma.bundlePurchase.create({
    data: {
      userId,
      stripeSessionId: session.id,
      amountTotal: session.amount_total ?? BUNDLE_PRICE_CENTS,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "actif",
      subscriptionCurrentPeriodEnd: new Date(Date.now() + BUNDLE_PREMIUM_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  const email = session.customer_details?.email ?? session.customer_email ?? user.email;
  if (!isEmailConfigured()) {
    console.error(`Achat Pack Complet ${session.id} : impossible d'envoyer les ebooks, RESEND_API_KEY manquant.`);
    return;
  }

  try {
    await sendBundleEmail(
      email,
      Object.values(EBOOK_PRODUCTS).map((p) => ({ pdfPath: p.pdfPath, downloadFilename: p.downloadFilename }))
    );
  } catch (error) {
    console.error(`Achat Pack Complet ${session.id} : echec de l'envoi des ebooks par email:`, error);
  }
}
