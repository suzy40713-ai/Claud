import Stripe from "stripe";
import { env } from "../../lib/env.js";
import { prisma } from "../../lib/prisma.js";
import { isEmailConfigured, sendEbookEmail } from "../../lib/email.js";

let stripeClient: Stripe | null = null;

export function isEbookCheckoutConfigured(): boolean {
  return Boolean(env.stripeSecretKey);
}

function getStripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw Object.assign(new Error("STRIPE_SECRET_KEY non configure."), { statusCode: 503 });
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}

export const EBOOK_PRODUCT_METADATA_VALUE = "ebook-transformation-90-jours";

export async function createEbookCheckoutSessionUrl(frontendOrigin: string): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: env.ebookPriceCents,
          product_data: {
            name: "Ebook Kadence — Transformation 90 Jours",
            description:
              "87 pages : programme d'entrainement complet, nutrition, mental et carnet de suivi, pour transformer ton physique en 3 mois.",
          },
        },
      },
    ],
    success_url: `${frontendOrigin}/ebook?checkout=succes`,
    cancel_url: `${frontendOrigin}/ebook?checkout=annule`,
    metadata: { product: EBOOK_PRODUCT_METADATA_VALUE },
  });

  if (!session.url) {
    throw new Error("Stripe n'a pas renvoye d'URL de paiement.");
  }
  return session.url;
}

export function isEbookCheckoutSession(session: Stripe.Checkout.Session): boolean {
  return session.mode === "payment" && session.metadata?.product === EBOOK_PRODUCT_METADATA_VALUE;
}

/**
 * Traite un paiement ebook confirme par Stripe : enregistre l'achat (avec
 * idempotence sur l'ID de session, un webhook peut etre livre plusieurs
 * fois) puis envoie le PDF par email. Un echec d'envoi email ne fait pas
 * echouer le webhook (le paiement a bien eu lieu) : il est trace en base
 * pour renvoi manuel eventuel.
 */
export async function handleEbookCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const email = session.customer_details?.email ?? session.customer_email;
  if (!email) {
    console.error(`Achat ebook sans email recupere sur la session Stripe ${session.id}`);
    return;
  }

  const purchase = await prisma.ebookPurchase.upsert({
    where: { stripeSessionId: session.id },
    update: {},
    create: {
      email,
      stripeSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      amountTotal: session.amount_total ?? env.ebookPriceCents,
    },
  });

  if (purchase.deliveryStatus === "envoye") {
    return;
  }

  if (!isEmailConfigured()) {
    await prisma.ebookPurchase.update({
      where: { id: purchase.id },
      data: { deliveryStatus: "echec", deliveryError: "RESEND_API_KEY non configure" },
    });
    console.error(`Achat ebook ${purchase.id} : impossible d'envoyer l'email, RESEND_API_KEY manquant.`);
    return;
  }

  try {
    await sendEbookEmail(email);
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
    console.error(`Achat ebook ${purchase.id} : echec de l'envoi de l'email:`, error);
  }
}
