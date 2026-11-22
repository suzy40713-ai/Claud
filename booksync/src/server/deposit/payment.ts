import "server-only";
import type Stripe from "stripe";
import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db/client";
import { appointment, customer, organization } from "@/db/schema";
import { computeDeposit, CHECKOUT_EXPIRY_MINUTES, depositAllowed } from "@/domain/billing/deposit";
import { effectivePlan } from "@/domain/billing/plans";
import { env } from "@/lib/env";
import { createManageToken } from "@/lib/manage-token";
import { UserError } from "@/server/errors";
import { enqueueBookingNotifications } from "@/server/notifications/queue";

type Org = typeof organization.$inferSelect;
type Appt = typeof appointment.$inferSelect;

/**
 * Acompte demandé pour cette prestation, si l'établissement l'a activé, que son compte Stripe
 * peut encaisser et que son forfait l'inclut. 0 sinon.
 */
export function depositFor(org: Org, priceCents: number) {
  const plan = effectivePlan(org.plan, org.subscriptionStatus);
  if (!org.stripeAccountId || !org.stripeAccountReady || !depositAllowed(plan.id)) return 0;
  return computeDeposit(org.depositMode, org.depositValue, priceCents);
}

/**
 * Page de paiement Stripe Checkout créée SUR le compte Stripe du professionnel (paiement direct) :
 * l'argent lui est versé directement, BookSync ne prélève rien.
 */
export async function createDepositCheckout(
  stripe: Stripe,
  org: Org,
  appt: Appt,
  customerEmail: string | null,
) {
  if (!org.stripeAccountId) throw new UserError("Paiement en ligne indisponible.");
  const token = createManageToken(appt.id);
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      locale: "fr",
      customer_email: customerEmail ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: appt.depositCents,
            product_data: {
              name: `Acompte — ${appt.serviceName}`,
              description: `Rendez-vous chez ${org.name}. Montant déduit du prix réglé sur place.`,
            },
          },
        },
      ],
      metadata: { appointmentId: appt.id, organizationId: org.id, kind: "booksync_deposit" },
      payment_intent_data: {
        description: `Acompte BookSync — ${org.name}`,
        metadata: { appointmentId: appt.id, organizationId: org.id },
      },
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRY_MINUTES * 60 + 30,
      success_url: `${env.NEXT_PUBLIC_APP_URL}/rdv/${token}?acompte=ok&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_APP_URL}/rdv/${token}?acompte=annule`,
    },
    { stripeAccount: org.stripeAccountId, idempotencyKey: `deposit-checkout-${appt.id}` },
  );
  await db
    .update(appointment)
    .set({ stripeCheckoutSessionId: session.id })
    .where(eq(appointment.id, appt.id));
  if (!session.url) throw new UserError("Impossible d'ouvrir la page de paiement.");
  return session.url;
}

/** Libère un créneau dont l'acompte n'a pas été payé (suppression du rendez-vous en attente). */
async function releaseHold(appointmentId: string) {
  const [deleted] = await db
    .delete(appointment)
    .where(and(eq(appointment.id, appointmentId), eq(appointment.status, "pending_payment")))
    .returning({ id: appointment.id });
  return Boolean(deleted);
}

/**
 * Paiement de l'acompte reçu : le rendez-vous passe à « confirmé » et les notifications
 * (confirmation, rappels, équipe) sont programmées. Idempotent. Si le créneau a déjà été libéré,
 * le paiement est remboursé automatiquement.
 */
export async function confirmDepositPayment(
  stripe: Stripe,
  session: Pick<
    Stripe.Checkout.Session,
    "id" | "payment_status" | "metadata" | "payment_intent" | "amount_total"
  >,
  stripeAccount: string | null | undefined,
): Promise<"confirmed" | "already" | "refunded" | "ignored"> {
  const appointmentId = session.metadata?.appointmentId;
  if (!appointmentId || session.payment_status !== "paid") return "ignored";
  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ appt: appointment, org: organization, cust: customer })
      .from(appointment)
      .innerJoin(organization, eq(organization.id, appointment.organizationId))
      .innerJoin(customer, eq(customer.id, appointment.customerId))
      .where(eq(appointment.id, appointmentId))
      .for("update", { of: appointment });
    if (!row) return "missing" as const;
    // Événement d'un autre compte Stripe que celui de l'établissement : jamais pris en compte.
    if (row.org.stripeAccountId !== stripeAccount) return "foreign" as const;
    if (row.appt.status !== "pending_payment") return "already" as const;
    const [updated] = await tx
      .update(appointment)
      .set({
        status: "confirmed",
        depositStatus: "paid",
        paymentExpiresAt: null,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntent,
      })
      .where(eq(appointment.id, appointmentId))
      .returning();
    await enqueueBookingNotifications(tx, "created", {
      organization: row.org,
      plan: effectivePlan(row.org.plan, row.org.subscriptionStatus),
      appointment: updated,
      customer: row.cust,
      actor: { kind: "customer" },
    });
    return "confirmed" as const;
  });

  if (result === "foreign") return "ignored";
  if (result === "missing") {
    // Créneau déjà libéré (paiement arrivé trop tard) : on rembourse le client, uniquement sur
    // le compte Stripe d'un établissement BookSync.
    const [known] = stripeAccount
      ? await db
          .select({ id: organization.id })
          .from(organization)
          .where(eq(organization.stripeAccountId, stripeAccount))
      : [];
    if (paymentIntent && stripeAccount && known) {
      await stripe.refunds.create(
        { payment_intent: paymentIntent, reason: "requested_by_customer" },
        { stripeAccount, idempotencyKey: `deposit-late-refund-${paymentIntent}` },
      );
      console.warn(
        "[acompte] paiement reçu après libération du créneau : remboursé",
        appointmentId,
      );
      return "refunded";
    }
    return "ignored";
  }
  return result;
}

/** Remboursement intégral de l'acompte (annulation). Échec : marqué pour suivi, jamais silencieux. */
export async function refundDeposit(org: Org, appt: Appt, stripe: Stripe | null) {
  let status: "refunded" | "refund_failed" = "refund_failed";
  if (stripe && org.stripeAccountId && appt.stripePaymentIntentId) {
    try {
      await stripe.refunds.create(
        { payment_intent: appt.stripePaymentIntentId, reason: "requested_by_customer" },
        { stripeAccount: org.stripeAccountId, idempotencyKey: `deposit-refund-${appt.id}` },
      );
      status = "refunded";
    } catch (error) {
      console.error("[acompte] échec du remboursement", appt.id, error);
    }
  } else {
    console.error("[acompte] remboursement impossible (Stripe non configuré)", appt.id);
  }
  const [updated] = await db
    .update(appointment)
    .set({ depositStatus: status })
    .where(eq(appointment.id, appt.id))
    .returning();
  return updated;
}

/** Retour de Stripe Checkout : confirmation immédiate (le webhook le fera aussi, de façon idempotente). */
export async function syncDepositReturn(stripe: Stripe | null, appointmentId: string) {
  if (!stripe) return;
  const [row] = await db
    .select({ appt: appointment, org: organization })
    .from(appointment)
    .innerJoin(organization, eq(organization.id, appointment.organizationId))
    .where(eq(appointment.id, appointmentId));
  if (
    !row ||
    row.appt.status !== "pending_payment" ||
    !row.appt.stripeCheckoutSessionId ||
    !row.org.stripeAccountId
  )
    return;
  const session = await stripe.checkout.sessions.retrieve(
    row.appt.stripeCheckoutSessionId,
    {},
    { stripeAccount: row.org.stripeAccountId },
  );
  await confirmDepositPayment(stripe, session, row.org.stripeAccountId);
}

/** Page de paiement encore ouverte pour un rendez-vous en attente (bouton « Payer l'acompte »). */
export async function resumeDepositCheckout(stripe: Stripe | null, appointmentId: string) {
  const [row] = await db
    .select({ appt: appointment, org: organization, email: customer.email })
    .from(appointment)
    .innerJoin(organization, eq(organization.id, appointment.organizationId))
    .innerJoin(customer, eq(customer.id, appointment.customerId))
    .where(eq(appointment.id, appointmentId));
  if (!row || row.appt.status !== "pending_payment")
    throw new UserError("Ce rendez-vous n'attend plus de paiement.");
  if (!stripe || !row.org.stripeAccountId) throw new UserError("Paiement en ligne indisponible.");
  if (row.appt.stripeCheckoutSessionId) {
    const s = await stripe.checkout.sessions.retrieve(
      row.appt.stripeCheckoutSessionId,
      {},
      { stripeAccount: row.org.stripeAccountId },
    );
    if (s.status === "open" && s.url) return s.url;
    if (s.status === "complete") {
      await confirmDepositPayment(stripe, s, row.org.stripeAccountId);
      throw new UserError("L'acompte est déjà payé : votre rendez-vous est confirmé.");
    }
  }
  throw new UserError("Le délai de paiement est dépassé. Reprenez rendez-vous.");
}

/** Abandon volontaire avant paiement : la page Stripe est fermée et le créneau libéré. */
export async function abandonDeposit(stripe: Stripe | null, appointmentId: string) {
  const [row] = await db
    .select({ appt: appointment, org: organization })
    .from(appointment)
    .innerJoin(organization, eq(organization.id, appointment.organizationId))
    .where(eq(appointment.id, appointmentId));
  if (!row || row.appt.status !== "pending_payment") return false;
  if (stripe && row.org.stripeAccountId && row.appt.stripeCheckoutSessionId) {
    const s = await stripe.checkout.sessions.retrieve(
      row.appt.stripeCheckoutSessionId,
      {},
      { stripeAccount: row.org.stripeAccountId },
    );
    if (s.status === "complete") {
      await confirmDepositPayment(stripe, s, row.org.stripeAccountId);
      return false;
    }
    if (s.status === "open")
      await stripe.checkout.sessions.expire(s.id, {}, { stripeAccount: row.org.stripeAccountId });
  }
  return releaseHold(appointmentId);
}

/**
 * Créneaux bloqués dont le délai de paiement est dépassé (planificateur) : on vérifie l'état réel
 * chez Stripe — payé → confirmé ; sinon la page est fermée et le créneau libéré.
 */
export async function releaseExpiredDeposits(stripe: Stripe | null, now = new Date()) {
  const stats = { released: 0, confirmed: 0, errors: 0 };
  const due = await db
    .select({ appt: appointment, org: organization })
    .from(appointment)
    .innerJoin(organization, eq(organization.id, appointment.organizationId))
    .where(and(eq(appointment.status, "pending_payment"), lt(appointment.paymentExpiresAt, now)))
    .limit(100);
  for (const { appt, org } of due) {
    try {
      if (stripe && org.stripeAccountId && appt.stripeCheckoutSessionId) {
        const s = await stripe.checkout.sessions.retrieve(
          appt.stripeCheckoutSessionId,
          {},
          { stripeAccount: org.stripeAccountId },
        );
        if (s.status === "complete" && s.payment_status === "paid") {
          if ((await confirmDepositPayment(stripe, s, org.stripeAccountId)) === "confirmed")
            stats.confirmed++;
          continue;
        }
        if (s.status === "open")
          await stripe.checkout.sessions.expire(s.id, {}, { stripeAccount: org.stripeAccountId });
      } else if (appt.stripeCheckoutSessionId) {
        // Impossible de vérifier chez Stripe : on ne libère pas un créneau peut-être payé.
        stats.errors++;
        continue;
      }
      if (await releaseHold(appt.id)) stats.released++;
    } catch (error) {
      console.error("[acompte] libération impossible", appt.id, error);
      stats.errors++;
    }
  }
  return stats;
}

/** Événements Stripe des comptes connectés (webhook Connect). */
export async function handleDepositEvent(event: Stripe.Event, stripe: Stripe) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = event.data.object;
      if (s.metadata?.kind === "booksync_deposit")
        await confirmDepositPayment(stripe, s, event.account);
      if (s.metadata?.kind === "booksync_gift_card") {
        const { confirmGiftCardPayment } = await import("@/server/gift-cards");
        await confirmGiftCardPayment(s, event.account);
      }
      break;
    }
    case "checkout.session.expired": {
      const s = event.data.object;
      if (s.metadata?.kind === "booksync_gift_card" && s.metadata.giftCardId) {
        const { discardUnpaidGiftCard } = await import("@/server/gift-cards");
        await discardUnpaidGiftCard(s.metadata.giftCardId, event.account);
        break;
      }
      const id = s.metadata?.appointmentId;
      if (s.metadata?.kind === "booksync_deposit" && id) {
        const [appt] = await db
          .select({ id: appointment.id })
          .from(appointment)
          .innerJoin(organization, eq(organization.id, appointment.organizationId))
          .where(
            and(eq(appointment.id, id), eq(organization.stripeAccountId, event.account ?? "")),
          );
        if (appt) await releaseHold(id);
      }
      break;
    }
    case "account.updated": {
      const { syncConnectedAccount } = await import("./connect");
      await syncConnectedAccount(event.data.object);
      break;
    }
    case "account.application.deauthorized": {
      if (event.account)
        await db
          .update(organization)
          .set({ stripeAccountId: null, stripeAccountReady: false, depositMode: "none" })
          .where(eq(organization.stripeAccountId, event.account));
      break;
    }
    default:
      break;
  }
}
