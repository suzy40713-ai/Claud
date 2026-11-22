import "server-only";
import { randomBytes } from "node:crypto";
import type Stripe from "stripe";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { giftCard, giftCardUse, organization, user } from "@/db/schema";
import {
  formatGiftCode,
  giftCardExpiry,
  giftCardsAllowed,
  GIFT_MESSAGE_MAX,
  euros,
  normalizeGiftCode,
  parseGiftAmounts,
  redeemGiftCard,
} from "@/domain/billing/gift-card";
import { CHECKOUT_EXPIRY_MINUTES } from "@/domain/billing/deposit";
import { effectivePlan } from "@/domain/billing/plans";
import { assertCan } from "@/domain/permissions";
import { env } from "@/lib/env";
import { createGiftCardToken, giftCardUrl } from "@/lib/manage-token";
import type { OrgContext } from "@/server/auth/session";
import { giftCardEmail } from "@/server/email/booking-templates";
import { sendEmail } from "@/server/email/send";
import { UserError } from "@/server/errors";

type Org = typeof organization.$inferSelect;
export type GiftCardRow = typeof giftCard.$inferSelect;

/**
 * Le salon peut-il vendre des cartes cadeaux en ligne ? Il faut l'option activée, un compte
 * Stripe capable d'encaisser et un forfait qui l'inclut.
 */
export function giftCardsOffered(org: Org) {
  const plan = effectivePlan(org.plan, org.subscriptionStatus);
  return Boolean(
    org.giftCardsEnabled &&
    org.stripeAccountId &&
    org.stripeAccountReady &&
    giftCardsAllowed(plan.id),
  );
}

// ---------------------------------------------------------------------------
// Réglages (tableau de bord)
// ---------------------------------------------------------------------------

export async function updateGiftCardSettings(
  ctx: OrgContext,
  input: { enabled: boolean; amounts: string },
) {
  assertCan(ctx.role, "billing.manage");
  const parsed = parseGiftAmounts(input.amounts);
  if (!parsed.ok) throw new UserError(parsed.error, { amounts: parsed.error });
  if (input.enabled) {
    if (!giftCardsAllowed(ctx.plan.id))
      throw new UserError("Les cartes cadeaux sont incluses à partir du forfait Starter.");
    if (!ctx.organization.stripeAccountId || !ctx.organization.stripeAccountReady)
      throw new UserError(
        "Connectez d'abord votre compte Stripe pour encaisser les cartes cadeaux.",
      );
  }
  await db
    .update(organization)
    .set({ giftCardsEnabled: input.enabled, giftCardAmounts: parsed.amounts })
    .where(eq(organization.id, ctx.organization.id));
}

// ---------------------------------------------------------------------------
// Achat en ligne (page publique du salon)
// ---------------------------------------------------------------------------

export const giftPurchaseSchema = z.object({
  amountCents: z.coerce.number().int(),
  buyerName: z.string().trim().min(2, "Indiquez votre nom.").max(80),
  buyerEmail: z.string().trim().toLowerCase().email("Adresse email invalide.").max(200),
  recipientName: z.string().trim().min(2, "Indiquez le prénom de la personne.").max(80),
  message: z
    .string()
    .trim()
    .max(GIFT_MESSAGE_MAX, `${GIFT_MESSAGE_MAX} caractères maximum.`)
    .optional()
    .transform((v) => (v ? v : null)),
});

async function insertWithUniqueCode(
  values: Omit<typeof giftCard.$inferInsert, "code">,
): Promise<GiftCardRow> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = formatGiftCode(randomBytes(8));
    const [row] = await db
      .insert(giftCard)
      .values({ ...values, code })
      .onConflictDoNothing({ target: [giftCard.organizationId, giftCard.code] })
      .returning();
    if (row) return row;
  }
  throw new Error("Impossible de générer un code de carte cadeau unique.");
}

/**
 * Crée la carte (en attente de paiement) puis la page de paiement Stripe Checkout SUR le compte
 * Stripe du professionnel : l'argent lui est versé directement, BookSync ne prélève rien.
 */
export async function createGiftCardCheckout(
  stripe: Stripe | null,
  org: Org,
  input: z.input<typeof giftPurchaseSchema>,
) {
  if (!stripe || !giftCardsOffered(org) || !org.stripeAccountId)
    throw new UserError("Ce salon ne vend pas de cartes cadeaux en ligne pour le moment.");
  const data = giftPurchaseSchema.parse(input);
  if (!org.giftCardAmounts.includes(data.amountCents))
    throw new UserError("Choisissez un des montants proposés.");

  const card = await insertWithUniqueCode({
    organizationId: org.id,
    amountCents: data.amountCents,
    balanceCents: data.amountCents,
    buyerName: data.buyerName,
    buyerEmail: data.buyerEmail,
    recipientName: data.recipientName,
    message: data.message,
  });
  const token = createGiftCardToken(card.id);
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      locale: "fr",
      customer_email: data.buyerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: card.amountCents,
            product_data: {
              name: `Carte cadeau ${euros(card.amountCents)} — ${org.name}`,
              description: `Pour ${card.recipientName}. Valable 12 mois, utilisable au salon.`,
            },
          },
        },
      ],
      metadata: { giftCardId: card.id, organizationId: org.id, kind: "booksync_gift_card" },
      payment_intent_data: {
        description: `Carte cadeau BookSync — ${org.name}`,
        metadata: { giftCardId: card.id, organizationId: org.id },
      },
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRY_MINUTES * 60 + 30,
      success_url: `${env.NEXT_PUBLIC_APP_URL}/carte-cadeau/${token}?paiement=ok`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/${org.slug}/carte-cadeau?paiement=annule`,
    },
    { stripeAccount: org.stripeAccountId, idempotencyKey: `gift-card-checkout-${card.id}` },
  );
  await db
    .update(giftCard)
    .set({ stripeCheckoutSessionId: session.id })
    .where(eq(giftCard.id, card.id));
  if (!session.url) throw new UserError("Impossible d'ouvrir la page de paiement.");
  return session.url;
}

/**
 * Paiement reçu : la carte devient utilisable (valable 12 mois) et l'acheteur reçoit le lien.
 * Idempotent ; un événement venant d'un autre compte Stripe que celui du salon est ignoré.
 */
export async function confirmGiftCardPayment(
  session: Pick<Stripe.Checkout.Session, "id" | "payment_status" | "metadata" | "payment_intent">,
  stripeAccount: string | null | undefined,
): Promise<"confirmed" | "already" | "ignored"> {
  const giftCardId = session.metadata?.giftCardId;
  if (!giftCardId || session.payment_status !== "paid") return "ignored";
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ card: giftCard, org: organization })
      .from(giftCard)
      .innerJoin(organization, eq(organization.id, giftCard.organizationId))
      .where(eq(giftCard.id, giftCardId))
      .for("update", { of: giftCard });
    if (!row || !stripeAccount || row.org.stripeAccountId !== stripeAccount) return null;
    if (row.card.status === "active") return { kind: "already" as const };
    const paidAt = new Date();
    const [card] = await tx
      .update(giftCard)
      .set({
        status: "active",
        paidAt,
        expiresAt: giftCardExpiry(paidAt),
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntent,
      })
      .where(eq(giftCard.id, giftCardId))
      .returning();
    return { kind: "confirmed" as const, card, org: row.org };
  });

  if (!result) return "ignored";
  if (result.kind === "already") return "already";
  const { card, org } = result;
  await sendEmail(
    card.buyerEmail,
    giftCardEmail({
      organizationName: org.name,
      buyerFirstName: card.buyerName.split(/\s+/)[0] ?? card.buyerName,
      recipientName: card.recipientName,
      amountLabel: euros(card.amountCents),
      code: card.code,
      expiresLabel: formatDate(card.expiresAt!, org.timezone),
      cardUrl: giftCardUrl(env.NEXT_PUBLIC_APP_URL, card.id),
      bookingUrl: `${env.NEXT_PUBLIC_APP_URL}/${org.slug}`,
      brandColor: org.brandColor,
    }),
  ).catch((error) => console.error("[carte cadeau] email non envoyé", card.id, error));
  return "confirmed";
}

/** Retour de Stripe : confirmation immédiate (le webhook le fera aussi, de façon idempotente). */
export async function syncGiftCardReturn(stripe: Stripe | null, giftCardId: string) {
  if (!stripe) return;
  const [row] = await db
    .select({ card: giftCard, org: organization })
    .from(giftCard)
    .innerJoin(organization, eq(organization.id, giftCard.organizationId))
    .where(eq(giftCard.id, giftCardId));
  if (!row || row.card.status !== "pending" || !row.card.stripeCheckoutSessionId) return;
  if (!row.org.stripeAccountId) return;
  const session = await stripe.checkout.sessions.retrieve(
    row.card.stripeCheckoutSessionId,
    {},
    { stripeAccount: row.org.stripeAccountId },
  );
  await confirmGiftCardPayment(session, row.org.stripeAccountId);
}

/** Page de paiement expirée sans paiement : la carte en attente est supprimée. */
export async function discardUnpaidGiftCard(giftCardId: string, stripeAccount: string | undefined) {
  if (!stripeAccount) return;
  await db
    .delete(giftCard)
    .where(
      and(
        eq(giftCard.id, giftCardId),
        eq(giftCard.status, "pending"),
        sql`${giftCard.organizationId} in (select id from organization where stripe_account_id = ${stripeAccount})`,
      ),
    );
}

// ---------------------------------------------------------------------------
// Consultation (lien signé) et gestion au salon
// ---------------------------------------------------------------------------

export async function getGiftCardView(giftCardId: string) {
  const [row] = await db
    .select({ card: giftCard, org: organization })
    .from(giftCard)
    .innerJoin(organization, eq(organization.id, giftCard.organizationId))
    .where(eq(giftCard.id, giftCardId));
  return row ?? null;
}

export async function listGiftCards(ctx: OrgContext, limit = 100) {
  assertCan(ctx.role, "customers.view_all");
  return db
    .select()
    .from(giftCard)
    .where(eq(giftCard.organizationId, ctx.organization.id))
    .orderBy(desc(giftCard.createdAt))
    .limit(limit);
}

/** Recherche d'une carte par son code (comptoir du salon). Tous les membres de l'équipe. */
export async function findGiftCardByCode(ctx: OrgContext, rawCode: string) {
  assertCan(ctx.role, "appointments.manage_own");
  const code = normalizeGiftCode(rawCode);
  if (!code) throw new UserError("Code invalide : il fait 8 caractères, par exemple ABCD-EFGH.");
  const [card] = await db
    .select()
    .from(giftCard)
    .where(and(eq(giftCard.organizationId, ctx.organization.id), eq(giftCard.code, code)));
  if (!card) throw new UserError("Aucune carte cadeau de votre salon ne porte ce code.");
  const uses = await db
    .select({
      amountCents: giftCardUse.amountCents,
      createdAt: giftCardUse.createdAt,
      by: user.name,
    })
    .from(giftCardUse)
    .leftJoin(user, eq(user.id, giftCardUse.userId))
    .where(eq(giftCardUse.giftCardId, card.id))
    .orderBy(desc(giftCardUse.createdAt));
  return { card, uses };
}

/**
 * Utilisation au salon : le montant est déduit du solde (verrou de ligne : deux utilisations
 * simultanées ne peuvent pas dépasser le solde) et l'opération est journalisée.
 */
export async function spendGiftCard(ctx: OrgContext, rawCode: string, amountCents: number) {
  assertCan(ctx.role, "appointments.manage_own");
  const code = normalizeGiftCode(rawCode);
  if (!code) throw new UserError("Code invalide : il fait 8 caractères, par exemple ABCD-EFGH.");
  return db.transaction(async (tx) => {
    const [card] = await tx
      .select()
      .from(giftCard)
      .where(and(eq(giftCard.organizationId, ctx.organization.id), eq(giftCard.code, code)))
      .for("update");
    if (!card) throw new UserError("Aucune carte cadeau de votre salon ne porte ce code.");
    const result = redeemGiftCard(card, amountCents);
    if (!result.ok) throw new UserError(result.error);
    await tx.insert(giftCardUse).values({
      organizationId: ctx.organization.id,
      giftCardId: card.id,
      amountCents,
      userId: ctx.userId,
    });
    const [updated] = await tx
      .update(giftCard)
      .set({ balanceCents: result.balanceCents })
      .where(eq(giftCard.id, card.id))
      .returning();
    return updated;
  });
}

export function formatDate(d: Date, timeZone = "Europe/Paris") {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone }).format(d);
}
