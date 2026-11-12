import { afterAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import {
  appointment,
  autopilotAction,
  emailMessage,
  organization,
  waitlistEntry,
  waitlistOffer,
} from "@/db/schema";
import { localDateOf } from "@/domain/availability/engine";
import { createOfferToken } from "@/lib/manage-token";
import { setAutomation } from "@/server/autopilot/rules";
import { cancelAppointment, createAppointment } from "@/server/booking/book";
import { createService } from "@/server/catalog/services";
import {
  acceptOffer,
  addWaitlistEntry,
  getOfferView,
  joinWaitlistPublic,
  processWaitlist,
} from "@/server/waitlist/service";
import { makeOrg, nextDayAt, uid } from "./factory";

afterAll(() => pg.end());

async function setup(plan: "free" | "starter" | "pro" = "pro") {
  const ctx = await makeOrg({ plan });
  const svc = await createService(ctx, {
    name: "Coupe",
    durationMinutes: 30,
    priceCents: 2500,
    staffIds: [ctx.staffId!],
  });
  const loadOrg = async () =>
    (await db.select().from(organization).where(eq(organization.id, ctx.organization.id)))[0];
  const startsAt = nextDayAt(14, 0, 3); // dans 3 jours à 14 h (Paris)
  const date = localDateOf(startsAt, "Europe/Paris");
  const book = async () =>
    createAppointment({
      org: await loadOrg(),
      serviceId: svc.id,
      staffId: null,
      startsAt,
      source: "online",
      customer: {
        firstName: "Paul",
        lastName: "Martin",
        email: `${uid()}@example.com`,
        phone: null,
      },
      actor: { kind: "customer" },
      enforceSchedule: true,
    });
  const cancel = async (id: string) =>
    cancelAppointment({
      org: await loadOrg(),
      appointmentId: id,
      by: "customer",
      actor: { kind: "customer" },
    });
  const enroll = (over: Partial<Parameters<typeof addWaitlistEntry>[1]> = {}) =>
    addWaitlistEntry(ctx, {
      firstName: "Léa",
      lastName: `Attente ${uid()}`,
      email: `${uid()}@example.com`,
      serviceId: svc.id,
      dateFrom: date,
      dateTo: date,
      ...over,
    });
  return { ctx, svc, startsAt, date, book, cancel, enroll, loadOrg };
}

const offersOf = (orgId: string) =>
  db.select().from(waitlistOffer).where(eq(waitlistOffer.organizationId, orgId));

describe("liste d'attente intelligente", () => {
  it("annulation : le créneau est proposé aux inscrits compatibles seulement, par email", async () => {
    const s = await setup();
    const ok = await s.enroll({ timeRange: "afternoon" });
    await s.enroll({ timeRange: "morning" }); // 14 h : incompatible
    const appt = await s.book();
    await s.cancel(appt.id);

    const offers = await offersOf(s.ctx.organization.id);
    expect(offers.map((o) => o.entryId)).toEqual([ok.id]);
    expect(offers[0]).toMatchObject({ status: "pending", staffId: s.ctx.staffId });
    expect(offers[0].startsAt.getTime()).toBe(s.startsAt.getTime());
    expect(offers[0].expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 2 * 3_600_000 + 1000);

    const stats = await processWaitlist();
    expect(stats.sent).toBeGreaterThanOrEqual(1);
    const [entryRow] = await db.select().from(waitlistEntry).where(eq(waitlistEntry.id, ok.id));
    void entryRow;
    const mails = await db
      .select()
      .from(emailMessage)
      .where(eq(emailMessage.template, "waitlist_offer"));
    const mine = mails.find((m) => m.text.includes(createOfferToken(offers[0].id)));
    expect(mine?.subject).toMatch(/^Créneau disponible : .* à 14:00/);
    const [after] = await db.select().from(waitlistOffer).where(eq(waitlistOffer.id, offers[0].id));
    expect(after.notifiedAt).not.toBeNull();
    // Deuxième passage : aucun renvoi.
    await processWaitlist();
    const again = await db
      .select()
      .from(emailMessage)
      .where(eq(emailMessage.template, "waitlist_offer"));
    expect(again.filter((m) => m.text.includes(createOfferToken(offers[0].id)))).toHaveLength(1);

    const log = await db
      .select()
      .from(autopilotAction)
      .where(eq(autopilotAction.organizationId, s.ctx.organization.id));
    expect(log.some((l) => l.kind === "waitlist.offered")).toBe(true);
  });

  it("le premier qui confirme obtient le créneau ; les autres propositions tombent", async () => {
    const s = await setup();
    const a = await s.enroll();
    const b = await s.enroll();
    const appt = await s.book();
    await s.cancel(appt.id);
    const offers = await offersOf(s.ctx.organization.id);
    expect(offers).toHaveLength(2);
    const tokenA = createOfferToken(offers.find((o) => o.entryId === a.id)!.id);
    const tokenB = createOfferToken(offers.find((o) => o.entryId === b.id)!.id);

    const res = await acceptOffer(tokenA);
    expect(res.manageToken).toMatch(/\./);
    await expect(acceptOffer(tokenB)).rejects.toThrow(/plus valable/);
    expect((await getOfferView(tokenB))?.status).toBe("taken");
    expect((await getOfferView(tokenA))?.status).toBe("accepted");

    const [entryA] = await db.select().from(waitlistEntry).where(eq(waitlistEntry.id, a.id));
    expect(entryA.status).toBe("booked");
    const booked = await db
      .select()
      .from(appointment)
      .where(
        and(
          eq(appointment.organizationId, s.ctx.organization.id),
          eq(appointment.status, "confirmed"),
        ),
      );
    expect(booked).toHaveLength(1);
    expect(booked[0].customerId).toBe(a.customerId);
    // Lien rejoué : idempotent.
    await expect(acceptOffer(tokenA)).resolves.toEqual(res);
  });

  it("confirmations simultanées : un seul rendez-vous, jamais de double réservation", async () => {
    const s = await setup();
    await s.enroll();
    await s.enroll();
    await s.enroll();
    const appt = await s.book();
    await s.cancel(appt.id);
    const offers = await offersOf(s.ctx.organization.id);
    expect(offers).toHaveLength(3);
    const results = await Promise.allSettled(
      offers.map((o) => acceptOffer(createOfferToken(o.id))),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const confirmed = await db
      .select()
      .from(appointment)
      .where(
        and(
          eq(appointment.organizationId, s.ctx.organization.id),
          eq(appointment.status, "confirmed"),
        ),
      );
    expect(confirmed).toHaveLength(1);
    const final = await offersOf(s.ctx.organization.id);
    expect(final.filter((o) => o.status === "accepted")).toHaveLength(1);
    expect(final.filter((o) => o.status === "pending")).toHaveLength(0);
  });

  it("expiration : le créneau est proposé aux inscrits suivants", async () => {
    const s = await setup();
    const first = await Promise.all([s.enroll(), s.enroll(), s.enroll()]);
    void first;
    const fourth = await s.enroll();
    const appt = await s.book();
    await s.cancel(appt.id);
    let offers = await offersOf(s.ctx.organization.id);
    expect(offers.map((o) => o.entryId)).not.toContain(fourth.id);
    await db
      .update(waitlistOffer)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(waitlistOffer.organizationId, s.ctx.organization.id));
    const stats = await processWaitlist();
    expect(stats.reoffered).toBeGreaterThanOrEqual(1);
    offers = await offersOf(s.ctx.organization.id);
    expect(offers.filter((o) => o.status === "expired")).toHaveLength(3);
    const next = offers.filter((o) => o.status === "pending");
    expect(next.map((o) => o.entryId)).toEqual([fourth.id]);
    const expiredToken = createOfferToken(offers.find((o) => o.status === "expired")!.id);
    expect((await getOfferView(expiredToken))?.status).toBe("expired");
    await expect(acceptOffer(expiredToken)).rejects.toThrow(/plus valable/);
  });

  it("forfait, réglage Autopilot et validations", async () => {
    const starter = await setup("starter");
    await expect(starter.enroll()).rejects.toThrow(/forfait Pro/);

    const s = await setup();
    await s.enroll();
    await setAutomation(s.ctx, "waitlist", false);
    const appt = await s.book();
    await s.cancel(appt.id);
    expect(await offersOf(s.ctx.organization.id)).toHaveLength(0);
    await expect(
      joinWaitlistPublic(await s.loadOrg(), {
        firstName: "A",
        lastName: "B",
        email: "a@example.com",
        serviceId: s.svc.id,
        dateFrom: s.date,
        dateTo: s.date,
      }),
    ).rejects.toThrow(/n'est pas disponible/);
    await setAutomation(s.ctx, "waitlist", true);

    await expect(s.enroll({ dateFrom: "2020-01-01", dateTo: "2020-01-02" })).rejects.toThrow(
      /aujourd'hui ou plus tard/,
    );
    const email = `${uid()}@example.com`;
    await s.enroll({ email });
    await s.enroll({ email });
    await s.enroll({ email });
    await expect(s.enroll({ email })).rejects.toThrow(/déjà inscrit 3 fois/);
    expect(await getOfferView("faux.jeton")).toBeNull();
  });

  it("isolation : un lien de proposition n'est pas falsifiable", async () => {
    const s = await setup();
    await s.enroll();
    const appt = await s.book();
    await s.cancel(appt.id);
    const [offer] = await offersOf(s.ctx.organization.id);
    const forged = `${offer.id}.${"A".repeat(32)}`;
    expect(await getOfferView(forged)).toBeNull();
    await expect(acceptOffer(forged)).rejects.toThrow(/Lien invalide/);
  });
});
