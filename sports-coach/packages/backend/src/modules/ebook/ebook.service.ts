import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";
import { env } from "../../lib/env.js";
import { prisma } from "../../lib/prisma.js";
import { isEmailConfigured, sendPurchaseEmail } from "../../lib/email.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, "..", "..", "..", "ebook-assets");

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

export interface EbookProductConfig {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number;
  pdfPath: string;
  downloadFilename: string;
  emailSubject: string;
  emailIntroHtml: string;
  successPath: string;
}

// Anciennes valeurs de metadata Stripe, conservees pour que les sessions
// Checkout deja creees avant l'introduction de plusieurs produits restent
// reconnues correctement.
const LEGACY_METADATA_ALIASES: Record<string, string> = {
  "ebook-transformation-90-jours": "transformation-90-jours",
};

export const EBOOK_PRODUCTS: Record<string, EbookProductConfig> = {
  "transformation-90-jours": {
    id: "transformation-90-jours",
    name: "Ebook Cadenzo — Transformation 90 Jours",
    description:
      "87 pages : programme d'entrainement complet, nutrition, mental et carnet de suivi, pour transformer ton physique en 3 mois.",
    priceCents: env.ebookPriceCents,
    compareAtPriceCents: env.ebookCompareAtPriceCents,
    pdfPath: path.join(ASSETS_DIR, "transformation-90-jours.pdf"),
    downloadFilename: "Cadenzo-Transformation-90-Jours.pdf",
    emailSubject: "Ton ebook Transformation 90 Jours est arrive 👑",
    emailIntroHtml: `
      <h1 style="font-size: 20px; color: #14121f;">Merci pour ton achat !</h1>
      <p>Ton ebook <strong>Transformation 90 Jours</strong> est en piece jointe de cet email, pret a etre lu des maintenant.</p>
      <p>Une astuce avant de commencer : imprime (ou garde ouvertes) les pages du carnet de suivi a la fin du livre. C'est cet outil, rempli chaque semaine, qui fait la plus grande difference sur la duree.</p>
    `,
    successPath: "/ebook",
  },
  "recettes-regime": {
    id: "recettes-regime",
    name: "Ebook Cadenzo — Recettes Regime",
    description:
      "20 recettes riches en proteines, faciles a preparer, pour manger equilibre pendant une perte de poids.",
    priceCents: 999,
    compareAtPriceCents: 1999,
    pdfPath: path.join(ASSETS_DIR, "recettes-regime.pdf"),
    downloadFilename: "Cadenzo-Recettes-Regime.pdf",
    emailSubject: "Ton ebook Recettes Regime est arrive 👑",
    emailIntroHtml: `
      <h1 style="font-size: 20px; color: #14121f;">Merci pour ton achat !</h1>
      <p>Ton ebook <strong>Recettes Regime</strong> (20 recettes riches en proteines) est en piece jointe de cet email.</p>
      <p>Une idee simple pour t'en servir : choisis 4-5 recettes qui te plaisent et fais-en ta base de la semaine, plutot que de vouloir toutes les tester d'un coup.</p>
    `,
    successPath: "/recettes-regime",
  },
  "recettes-prise-de-masse": {
    id: "recettes-prise-de-masse",
    name: "Ebook Cadenzo — Recettes Prise de Masse",
    description:
      "20 recettes caloriques et riches en proteines pour atteindre ton surplus plus facilement en periode de prise de masse.",
    priceCents: 999,
    compareAtPriceCents: 1999,
    pdfPath: path.join(ASSETS_DIR, "recettes-prise-de-masse.pdf"),
    downloadFilename: "Cadenzo-Recettes-Prise-De-Masse.pdf",
    emailSubject: "Ton ebook Recettes Prise de Masse est arrive 👑",
    emailIntroHtml: `
      <h1 style="font-size: 20px; color: #14121f;">Merci pour ton achat !</h1>
      <p>Ton ebook <strong>Recettes Prise de Masse</strong> (20 recettes caloriques et riches en proteines) est en piece jointe de cet email.</p>
      <p>Une idee simple pour t'en servir : garde 2-3 recettes de shake/collation sous la main pour les jours ou atteindre ton surplus calorique est le plus difficile.</p>
    `,
    successPath: "/recettes-prise-de-masse",
  },
  "guide-musculation-debutant": {
    id: "guide-musculation-debutant",
    name: "Ebook Cadenzo — Bases de la Musculation",
    description:
      "Le programme simple pour bien debuter en musculation (full-body, 4 semaines), sans se blesser et sans perdre de temps.",
    priceCents: 999,
    compareAtPriceCents: 1999,
    pdfPath: path.join(ASSETS_DIR, "guide-musculation-debutant.pdf"),
    downloadFilename: "Cadenzo-Bases-De-La-Musculation.pdf",
    emailSubject: "Ton ebook Bases de la Musculation est arrive 👑",
    emailIntroHtml: `
      <h1 style="font-size: 20px; color: #14121f;">Merci pour ton achat !</h1>
      <p>Ton ebook <strong>Bases de la Musculation</strong> est en piece jointe de cet email.</p>
      <p>Une idee simple pour demarrer : lis d'abord les 3 principes en debut de guide avant de te lancer dans la premiere seance — ils t'eviteront la plupart des erreurs de debutant.</p>
    `,
    successPath: "/guide-musculation-debutant",
  },
  "programme-maison-sans-materiel": {
    id: "programme-maison-sans-materiel",
    name: "Ebook Cadenzo — Cardio & Renfo Sans Materiel",
    description:
      "Un programme de 4 semaines a faire a la maison, sans materiel, 20 a 30 minutes par seance.",
    priceCents: 999,
    compareAtPriceCents: 1999,
    pdfPath: path.join(ASSETS_DIR, "programme-maison-sans-materiel.pdf"),
    downloadFilename: "Cadenzo-Cardio-Renfo-Sans-Materiel.pdf",
    emailSubject: "Ton ebook Cardio & Renfo Sans Materiel est arrive 👑",
    emailIntroHtml: `
      <h1 style="font-size: 20px; color: #14121f;">Merci pour ton achat !</h1>
      <p>Ton ebook <strong>Cardio & Renfo Sans Materiel</strong> est en piece jointe de cet email.</p>
      <p>Une idee simple pour demarrer : commence par le circuit de la semaine 1, meme si tu le trouves facile — l'intensite monte deja d'elle-meme a partir de la semaine 3.</p>
    `,
    successPath: "/programme-maison-sans-materiel",
  },
  "guide-sommeil-recuperation": {
    id: "guide-sommeil-recuperation",
    name: "Ebook Cadenzo — Dors Mieux, Progresse Plus Vite",
    description:
      "Le guide pratique du sommeil et de la recuperation pour progresser plus vite sans t'entrainer plus.",
    priceCents: 999,
    compareAtPriceCents: 1999,
    pdfPath: path.join(ASSETS_DIR, "guide-sommeil-recuperation.pdf"),
    downloadFilename: "Cadenzo-Dors-Mieux-Progresse-Plus-Vite.pdf",
    emailSubject: "Ton ebook Dors Mieux, Progresse Plus Vite est arrive 👑",
    emailIntroHtml: `
      <h1 style="font-size: 20px; color: #14121f;">Merci pour ton achat !</h1>
      <p>Ton ebook <strong>Dors Mieux, Progresse Plus Vite</strong> est en piece jointe de cet email.</p>
      <p>Une idee simple pour demarrer : choisis un seul des 5 points de la routine du soir a mettre en place cette semaine, plutot que de vouloir tout changer d'un coup.</p>
    `,
    successPath: "/guide-sommeil-recuperation",
  },
};

export function getEbookProduct(productId: string): EbookProductConfig {
  const product = EBOOK_PRODUCTS[productId];
  if (!product) {
    throw Object.assign(new Error("Produit ebook inconnu."), { statusCode: 404 });
  }
  return product;
}

export function isEbookCheckoutConfigured(): boolean {
  return Boolean(env.stripeSecretKey);
}

export async function createEbookCheckoutSessionUrl(frontendOrigin: string, productId: string): Promise<string> {
  const stripe = getStripe();
  const product = getEbookProduct(productId);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: product.priceCents,
          product_data: {
            name: product.name,
            description: product.description,
          },
        },
      },
    ],
    success_url: `${frontendOrigin}${product.successPath}?checkout=succes`,
    cancel_url: `${frontendOrigin}${product.successPath}?checkout=annule`,
    metadata: { product: product.id },
  });

  if (!session.url) {
    throw new Error("Stripe n'a pas renvoye d'URL de paiement.");
  }
  return session.url;
}

function resolveProductId(session: Stripe.Checkout.Session): string | null {
  const raw = session.metadata?.product;
  if (!raw) return null;
  return LEGACY_METADATA_ALIASES[raw] ?? raw;
}

export function isEbookCheckoutSession(session: Stripe.Checkout.Session): boolean {
  if (session.mode !== "payment") return false;
  const productId = resolveProductId(session);
  return productId !== null && productId in EBOOK_PRODUCTS;
}

/**
 * Traite un paiement ebook confirme par Stripe : enregistre l'achat (avec
 * idempotence sur l'ID de session, un webhook peut etre livre plusieurs
 * fois) puis envoie le PDF correspondant par email. Un echec d'envoi email
 * ne fait pas echouer le webhook (le paiement a bien eu lieu) : il est
 * trace en base pour renvoi manuel eventuel.
 */
export async function handleEbookCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const email = session.customer_details?.email ?? session.customer_email;
  if (!email) {
    console.error(`Achat ebook sans email recupere sur la session Stripe ${session.id}`);
    return;
  }

  const productId = resolveProductId(session) ?? "transformation-90-jours";
  const product = getEbookProduct(productId);

  const purchase = await prisma.ebookPurchase.upsert({
    where: { stripeSessionId: session.id },
    update: {},
    create: {
      email,
      product: product.id,
      stripeSessionId: session.id,
      stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
      amountTotal: session.amount_total ?? product.priceCents,
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
    await sendPurchaseEmail(email, {
      subject: product.emailSubject,
      introHtml: product.emailIntroHtml,
      pdfPath: product.pdfPath,
      downloadFilename: product.downloadFilename,
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
    console.error(`Achat ebook ${purchase.id} : echec de l'envoi de l'email:`, error);
  }
}
