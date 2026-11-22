import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { and, eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { appointment, notification, organization } from "@/db/schema";
import { cancelAppointment, createAppointment, SlotTakenError } from "@/server/booking/book";
import { createService } from "@/server/catalog/services";
import { updateDepositSettings } from "@/server/deposit/connect";
import {
  abandonDeposit,
  confirmDepositPayment,
  createDepositCheckout,
  depositFor,
  handleDepositEvent,
  releaseExpiredDeposits,
} from "@/server/deposit/payment";
import { makeOrg, nextDayAt, uid } from "./factory";

afterAll(() => pg.end());
afterEach(() => vi.restoreAllMocks());

type SessionState = { status: "open" | "complete" | "expired"; payment_status: "paid" | "unpaid" };

/** Faux client Stripe : enregistre les appels, aucun accès réseau. */
function fakeStripe(state: SessionState = { status: "open", payment_status: "unpaid" }) {
  const calls = {
    create: vi.fn(async (params: Record<string, unknown>, opts: Record<string, unknown>) => ({
      id: `cs_test_${uid()}`,
      url: "https://checkout.stripe.com/c/pay/test",
      params,
      opts,
    })),
    retrieve: vi.fn(async (id: string) => ({
      id,
      ...state,
      url: "https://checkout.stripe.com/c/pay/test",
      payment_intent: "pi_test_123",
      metadata: { appointmentId: currentAppt, kind: "booksync_deposit" },
    })),
    expire: vi.fn(async () => ({})),
    refund: vi.fn(async () => ({ id: "re_test" })),
  };
  let currentAppt = "";
  const stripe = {
    checkout: {
      sessions: { create: calls.create, retrieve: calls.retrieve, expire: calls.expire },
    },
    refunds: { create: calls.refund },
  } as unknown as Stripe;
  return { stripe, calls, setAppt: (id: string) => (currentAppt = id) };
}

async function depositOrg(opts: { plan?: "free" | "starter" | "pro"; ready?: boolean } = {}) {
  const ctx = await makeOrg({ plan: opts.plan ?? "starter" });
  const acct = `acct_test_${uid()}`;
  await db
    .update(organization)
    .set({
      stripeAccountId: acct,
      stripeAccountReady: opts.ready ?? true,
      depositMode: "fixed",
      depositValue: 1000,
    })
    .where(eq(organization.id, ctx.organization.id));
  const svc = await createService(ctx, {
    name: "Couleur",
    durationMinutes: 60,
    priceCents: 6000,
    staffIds: [ctx.staffId!],
  });
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, ctx.organization.id));
  return { ctx: { ...ctx, organization: org }, org, svc, acct };
}

async function book(org: typeof organization.$inferSelect, serviceId: string, hour = 10) {
  return createAppointment({
    org,
    serviceId,
    staffId: null,
    startsAt: nextDayAt(hour, 0, 3),
    source: "online",
    customer: { firstName: "Inès", lastName: "Dubois", email: `${uid()}@example.com`, phone: null },
    actor: { kind: "customer" },
    enforceSchedule: true,
    deposit: (price) => depositFor(org, price),
  });
}

const notifs = (id: string) =>
  db.select().from(notification).where(eq(notification.appointmentId, id));

describe("acompte à la réservation", () => {
  it("montant demandé seulement si le compte Stripe est prêt et le forfait l'inclut", async () => {
    const ok = await depositOrg();
    expect(depositFor(ok.org, 6000)).toBe(1000);
    expect(depositFor(ok.org, 0)).toBe(0);
    const notReady = await depositOrg({ ready: false });
    expect(depositFor(notReady.org, 6000)).toBe(0);
    const free = await depositOrg({ plan: "free" });
    expect(depositFor(free.org, 6000)).toBe(0);
  });

  it("réservation en attente de paiement : créneau bloqué, aucune notification", async () => {
    const { org, svc } = await depositOrg();
    const appt = await book(org, svc.id);
    expect(appt).toMatchObject({
      status: "pending_payment",
      depositCents: 1000,
      depositStatus: "pending",
    });
    expect(appt.paymentExpiresAt!.getTime()).toBeGreaterThan(Date.now() + 30 * 60_000);
    expect(await notifs(appt.id)).toHaveLength(0);
    // Personne d'autre ne peut prendre le créneau pendant le paiement.
    await expect(book(org, svc.id)).rejects.toBeInstanceOf(SlotTakenError);
  });

  it("page de paiement créée sur le compte Stripe du professionnel, sans commission", async () => {
    const { org, svc, acct } = await depositOrg();
    const appt = await book(org, svc.id);
    const { stripe, calls } = fakeStripe();
    const url = await createDepositCheckout(stripe, org, appt, "client@example.com");
    expect(url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    const [params, opts] = calls.create.mock.calls[0];
    expect(opts).toMatchObject({ stripeAccount: acct });
    expect(params).toMatchObject({
      mode: "payment",
      line_items: [{ price_data: { currency: "eur", unit_amount: 1000 } }],
      metadata: { appointmentId: appt.id, kind: "booksync_deposit" },
    });
    expect(JSON.stringify(params)).not.toContain("application_fee");
    const [saved] = await db.select().from(appointment).where(eq(appointment.id, appt.id));
    expect(saved.stripeCheckoutSessionId).toMatch(/^cs_test_/);
  });

  it("paiement reçu : rendez-vous confirmé et notifications programmées, une seule fois", async () => {
    const { org, svc, acct } = await depositOrg();
    const appt = await book(org, svc.id);
    const { stripe } = fakeStripe();
    const session = {
      id: "cs_test_paid",
      payment_status: "paid" as const,
      payment_intent: "pi_test_1",
      amount_total: 1000,
      metadata: { appointmentId: appt.id, kind: "booksync_deposit" },
    };
    // Événement venant d'un autre compte Stripe : ignoré.
    expect(await confirmDepositPayment(stripe, session, "acct_autre")).toBe("ignored");
    expect(await confirmDepositPayment(stripe, session, acct)).toBe("confirmed");
    expect(await confirmDepositPayment(stripe, session, acct)).toBe("already");
    const [after] = await db.select().from(appointment).where(eq(appointment.id, appt.id));
    expect(after).toMatchObject({
      status: "confirmed",
      depositStatus: "paid",
      stripePaymentIntentId: "pi_test_1",
      paymentExpiresAt: null,
    });
    const types = (await notifs(appt.id)).map((n) => n.type);
    expect(types).toContain("booking_confirmation");
    expect(types.filter((t) => t === "booking_confirmation")).toHaveLength(1);
  });

  it("paiement arrivé après la libération du créneau : remboursé automatiquement", async () => {
    const { org, svc, acct } = await depositOrg();
    const appt = await book(org, svc.id);
    await abandonDeposit(null, appt.id);
    const { stripe, calls } = fakeStripe();
    const res = await confirmDepositPayment(
      stripe,
      {
        id: "cs_late",
        payment_status: "paid",
        payment_intent: "pi_late",
        amount_total: 1000,
        metadata: { appointmentId: appt.id },
      },
      acct,
    );
    expect(res).toBe("refunded");
    expect(calls.refund).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_late" }),
      expect.objectContaining({ stripeAccount: acct }),
    );
  });

  it("délai dépassé : page fermée et créneau libéré ; déjà payé : confirmé", async () => {
    const { org, svc } = await depositOrg();
    const unpaid = await book(org, svc.id, 10);
    const paid = await book(org, svc.id, 14);
    const expire = (id: string) =>
      db
        .update(appointment)
        .set({ stripeCheckoutSessionId: `cs_${id}`, paymentExpiresAt: new Date(Date.now() - 1000) })
        .where(eq(appointment.id, id));
    await expire(unpaid.id);

    const open = fakeStripe({ status: "open", payment_status: "unpaid" });
    open.setAppt(unpaid.id);
    await releaseExpiredDeposits(open.stripe);
    expect(open.calls.expire).toHaveBeenCalled();
    expect(await db.select().from(appointment).where(eq(appointment.id, unpaid.id))).toHaveLength(
      0,
    );
    // Le créneau est de nouveau réservable.
    const again = await book(org, svc.id, 10);
    expect(again.status).toBe("pending_payment");

    await expire(paid.id);
    const complete = fakeStripe({ status: "complete", payment_status: "paid" });
    complete.setAppt(paid.id);
    await releaseExpiredDeposits(complete.stripe);
    const [p] = await db.select().from(appointment).where(eq(appointment.id, paid.id));
    expect(p.status).toBe("confirmed");
  });

  it("sans accès à Stripe, un créneau avec page de paiement n'est jamais libéré à l'aveugle", async () => {
    const { org, svc } = await depositOrg();
    const appt = await book(org, svc.id);
    await db
      .update(appointment)
      .set({ stripeCheckoutSessionId: "cs_unknown", paymentExpiresAt: new Date(Date.now() - 1000) })
      .where(eq(appointment.id, appt.id));
    const stats = await releaseExpiredDeposits(null);
    expect(stats.errors).toBeGreaterThanOrEqual(1);
    expect(await db.select().from(appointment).where(eq(appointment.id, appt.id))).toHaveLength(1);
  });

  it("annulation d'un rendez-vous payé : acompte remboursé ; échec Stripe signalé", async () => {
    const { org, svc, acct } = await depositOrg();
    const appt = await book(org, svc.id, 10);
    await confirmDepositPayment(
      fakeStripe().stripe,
      {
        id: "cs_x",
        payment_status: "paid",
        payment_intent: "pi_ok",
        amount_total: 1000,
        metadata: { appointmentId: appt.id },
      },
      acct,
    );
    const ok = fakeStripe();
    const cancelled = await cancelAppointment({
      org,
      appointmentId: appt.id,
      by: "customer",
      actor: { kind: "customer" },
      stripe: ok.stripe,
    });
    expect(cancelled.depositStatus).toBe("refunded");
    expect(ok.calls.refund).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: "pi_ok" }),
      expect.objectContaining({ stripeAccount: acct, idempotencyKey: `deposit-refund-${appt.id}` }),
    );

    vi.spyOn(console, "error").mockImplementation(() => {});
    const appt2 = await book(org, svc.id, 14);
    await confirmDepositPayment(
      fakeStripe().stripe,
      {
        id: "cs_y",
        payment_status: "paid",
        payment_intent: "pi_ko",
        amount_total: 1000,
        metadata: { appointmentId: appt2.id },
      },
      acct,
    );
    const ko = fakeStripe();
    ko.calls.refund.mockRejectedValueOnce(new Error("Stripe indisponible"));
    const failed = await cancelAppointment({
      org,
      appointmentId: appt2.id,
      by: "staff",
      actor: { kind: "staff", email: "x@example.com" },
      stripe: ko.stripe,
    });
    expect(failed).toMatchObject({ status: "cancelled", depositStatus: "refund_failed" });
  });

  it("webhook « session expirée » : créneau libéré seulement pour le bon compte", async () => {
    const { org, svc, acct } = await depositOrg();
    const appt = await book(org, svc.id);
    const event = (account: string) =>
      ({
        id: `evt_${uid()}`,
        type: "checkout.session.expired",
        account,
        data: { object: { metadata: { appointmentId: appt.id, kind: "booksync_deposit" } } },
      }) as unknown as Stripe.Event;
    await handleDepositEvent(event("acct_autre"), fakeStripe().stripe);
    expect(await db.select().from(appointment).where(eq(appointment.id, appt.id))).toHaveLength(1);
    await handleDepositEvent(event(acct), fakeStripe().stripe);
    expect(await db.select().from(appointment).where(eq(appointment.id, appt.id))).toHaveLength(0);
  });

  it("réglages : compte Stripe requis, valeurs bornées", async () => {
    const { ctx } = await depositOrg({ ready: false });
    await expect(updateDepositSettings(ctx, { mode: "fixed", value: 10 })).rejects.toThrow(
      /Connectez d'abord/,
    );
    const ready = await depositOrg();
    await expect(
      updateDepositSettings(ready.ctx, { mode: "percent", value: 150 }),
    ).rejects.toThrow();
    await expect(updateDepositSettings(ready.ctx, { mode: "fixed", value: 0.2 })).rejects.toThrow();
    await updateDepositSettings(ready.ctx, { mode: "percent", value: 30 });
    const [o] = await db.select().from(organization).where(eq(organization.id, ready.org.id));
    expect(o).toMatchObject({ depositMode: "percent", depositValue: 30 });
    await updateDepositSettings(ready.ctx, { mode: "none", value: 0 });
    const [n] = await db
      .select()
      .from(organization)
      .where(and(eq(organization.id, ready.org.id)));
    expect(n.depositMode).toBe("none");
  });
});
