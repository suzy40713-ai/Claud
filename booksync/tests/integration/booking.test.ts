import { afterAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { appointment, customer, notification, organization, staff } from "@/db/schema";
import {
  cancelAppointment,
  createAppointment,
  getMonthlyUsage,
  rescheduleAppointment,
} from "@/server/booking/book";
import { getAvailability } from "@/server/booking/availability";
import { createService } from "@/server/catalog/services";
import { ctxFor, makeOrg, makeUser, nextDayAt, uid } from "./factory";

afterAll(() => pg.end());

async function setup(plan: "free" | "starter" | "pro" = "pro") {
  const ctx = await makeOrg({ plan });
  const svc = await createService(ctx, {
    name: "Coupe",
    durationMinutes: 30,
    priceCents: 2500,
    staffIds: [ctx.staffId!],
  });
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, ctx.organization.id));
  return { ctx, svc, org };
}

const client = () => ({
  firstName: "Léa",
  lastName: "Durand",
  email: `${uid()}@example.com`,
  phone: null,
});

describe("réservation (base réelle)", () => {
  it("propose des créneaux puis réserve ; le créneau disparaît ensuite", async () => {
    const { svc, org, ctx } = await setup();
    const startsAt = nextDayAt(10);
    const date = startsAt.toISOString().slice(0, 10);
    const before = await getAvailability(org, svc, [ctx.staffId!], date, date);
    expect(before[0].slots.some((s) => s.start.getTime() === startsAt.getTime())).toBe(true);

    const appt = await createAppointment({
      org,
      serviceId: svc.id,
      staffId: null,
      startsAt,
      source: "online",
      customer: client(),
      actor: { kind: "customer" },
      enforceSchedule: true,
    });
    expect(appt.staffId).toBe(ctx.staffId);
    expect(appt.endsAt.getTime() - appt.startsAt.getTime()).toBe(30 * 60_000);
    expect(appt.priceCents).toBe(2500);

    const after = await getAvailability(org, svc, [ctx.staffId!], date, date);
    expect(after[0].slots.some((s) => s.start.getTime() === startsAt.getTime())).toBe(false);
  });

  it("10 réservations simultanées sur le même créneau : une seule réussit", async () => {
    const { svc, org } = await setup();
    const startsAt = nextDayAt(11);
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        createAppointment({
          org,
          serviceId: svc.id,
          staffId: null,
          startsAt,
          source: "online",
          customer: client(),
          actor: { kind: "customer" },
          enforceSchedule: true,
        }),
      ),
    );
    const ok = results.filter((r) => r.status === "fulfilled");
    expect(ok).toHaveLength(1);
    for (const r of results.filter((r) => r.status === "rejected")) {
      expect((r as PromiseRejectedResult).reason.message).toMatch(/vient d'être réservé/);
    }
    const rows = await db
      .select()
      .from(appointment)
      .where(and(eq(appointment.organizationId, org.id), eq(appointment.startsAt, startsAt)));
    expect(rows).toHaveLength(1);
  });

  it("même en réservation manuelle (sans contrôle des horaires), la base refuse le chevauchement", async () => {
    const { svc, org, ctx } = await setup();
    const startsAt = nextDayAt(14);
    await createAppointment({
      org,
      serviceId: svc.id,
      staffId: ctx.staffId,
      startsAt,
      source: "manual",
      customer: client(),
      actor: { kind: "staff", email: ctx.user.email },
      enforceSchedule: false,
    });
    await expect(
      createAppointment({
        org,
        serviceId: svc.id,
        staffId: ctx.staffId,
        startsAt: new Date(startsAt.getTime() + 10 * 60_000),
        source: "manual",
        customer: client(),
        actor: { kind: "staff", email: ctx.user.email },
        enforceSchedule: false,
      }),
    ).rejects.toThrow(/vient d'être réservé/);
  });

  it("refuse un créneau hors horaires, hors grille ou dans le passé en réservation en ligne", async () => {
    const { svc, org } = await setup();
    const base = {
      org,
      serviceId: svc.id,
      staffId: null,
      source: "online" as const,
      actor: { kind: "customer" as const },
      enforceSchedule: true,
    };
    await expect(
      createAppointment({ ...base, startsAt: nextDayAt(20), customer: client() }),
    ).rejects.toThrow(/vient d'être réservé/);
    await expect(
      createAppointment({ ...base, startsAt: nextDayAt(10, 7), customer: client() }),
    ).rejects.toThrow();
    await expect(
      createAppointment({
        ...base,
        startsAt: new Date(Date.now() - 86_400_000),
        customer: client(),
      }),
    ).rejects.toThrow();
  });

  it("forfait Free : 5 réservations par mois maximum, compteur strict", async () => {
    const { svc, org } = await setup("free");
    for (let i = 0; i < 5; i++) {
      await createAppointment({
        org,
        serviceId: svc.id,
        staffId: null,
        startsAt: nextDayAt(9 + i),
        source: "online",
        customer: client(),
        actor: { kind: "customer" },
        enforceSchedule: true,
      });
    }
    expect(await getMonthlyUsage(org.id, org.timezone)).toBe(5);
    await expect(
      createAppointment({
        org,
        serviceId: svc.id,
        staffId: null,
        startsAt: nextDayAt(15),
        source: "online",
        customer: client(),
        actor: { kind: "customer" },
        enforceSchedule: true,
      }),
    ).rejects.toMatchObject({ name: "PlanLimitError", kind: "bookings" });
  });

  it("forfait Free : 20 clients maximum ; un client existant peut toujours réserver", async () => {
    const { svc, org, ctx } = await setup("free");
    await db.insert(customer).values(
      Array.from({ length: 20 }, (_, i) => ({
        organizationId: org.id,
        firstName: "C",
        lastName: String(i),
        email: `c${i}.${uid()}@example.com`,
      })),
    );
    await expect(
      createAppointment({
        org,
        serviceId: svc.id,
        staffId: null,
        startsAt: nextDayAt(9),
        source: "online",
        customer: client(),
        actor: { kind: "customer" },
        enforceSchedule: true,
      }),
    ).rejects.toMatchObject({ kind: "customers" });
    const [existing] = await db
      .select()
      .from(customer)
      .where(eq(customer.organizationId, org.id))
      .limit(1);
    const ok = await createAppointment({
      org,
      serviceId: svc.id,
      staffId: null,
      startsAt: nextDayAt(9),
      source: "online",
      customer: {
        firstName: "x",
        lastName: "y",
        email: existing.email!.toUpperCase(),
        phone: null,
      },
      actor: { kind: "customer" },
      enforceSchedule: true,
    });
    expect(ok.customerId).toBe(existing.id);
    expect(ctx.plan.id).toBe("free");
  });

  it("isolation : impossible de réserver le service ou l'employé d'une autre entreprise", async () => {
    const a = await setup();
    const b = await setup();
    await expect(
      createAppointment({
        org: a.org,
        serviceId: b.svc.id,
        staffId: null,
        startsAt: nextDayAt(10),
        source: "online",
        customer: client(),
        actor: { kind: "customer" },
        enforceSchedule: true,
      }),
    ).rejects.toThrow(/pas disponible/);
    await expect(
      createAppointment({
        org: a.org,
        serviceId: a.svc.id,
        staffId: b.ctx.staffId,
        startsAt: nextDayAt(10),
        source: "manual",
        customer: client(),
        actor: { kind: "customer" },
        enforceSchedule: false,
      }),
    ).rejects.toThrow(/indisponible/);
    // La base elle-même refuse un rendez-vous mélangeant deux entreprises (clé étrangère composite).
    const [c] = await db
      .insert(customer)
      .values({ organizationId: a.org.id, firstName: "A", lastName: "B" })
      .returning();
    await expect(
      db.insert(appointment).values({
        organizationId: a.org.id,
        staffId: b.ctx.staffId!,
        serviceId: a.svc.id,
        customerId: c.id,
        startsAt: nextDayAt(10),
        endsAt: nextDayAt(10, 30),
        blockedUntil: nextDayAt(10, 30),
        source: "manual",
        serviceName: "x",
      }),
    ).rejects.toMatchObject({ cause: { code: "23503" } });
  });

  it("notifications : Pro = confirmation + rappels 24 h et 2 h + alerte équipe ; dédupliquées", async () => {
    const { svc, org, ctx } = await setup("pro");
    const employee = await makeUser("Employé Test");
    void employee;
    const appt = await createAppointment({
      org,
      serviceId: svc.id,
      staffId: null,
      startsAt: nextDayAt(10, 0, 3),
      source: "online",
      customer: client(),
      actor: { kind: "customer" },
      enforceSchedule: true,
    });
    const rows = await db
      .select()
      .from(notification)
      .where(eq(notification.appointmentId, appt.id));
    const types = rows.map((r) => r.type).sort();
    expect(types).toEqual([
      "booking_confirmation",
      "reminder_24h",
      "reminder_2h",
      "staff_new_booking",
    ]);
    const r24 = rows.find((r) => r.type === "reminder_24h")!;
    expect(r24.scheduledFor.getTime()).toBe(appt.startsAt.getTime() - 24 * 3_600_000);
    expect(rows.find((r) => r.type === "staff_new_booking")!.recipient).toBe(
      ctx.user.email.toLowerCase(),
    );

    // Déplacement : anciens rappels annulés, nouveaux programmés, email de modification.
    const moved = await rescheduleAppointment({
      org,
      appointmentId: appt.id,
      startsAt: nextDayAt(15, 0, 3),
      enforceSchedule: true,
      actor: { kind: "customer" },
    });
    const after = await db
      .select()
      .from(notification)
      .where(eq(notification.appointmentId, appt.id));
    expect(after.filter((r) => r.type === "reminder_24h" && r.status === "pending")).toHaveLength(
      1,
    );
    expect(
      after
        .find((r) => r.type === "reminder_24h" && r.status === "pending")!
        .scheduledFor.getTime(),
    ).toBe(moved.startsAt.getTime() - 24 * 3_600_000);
    expect(after.some((r) => r.type === "booking_rescheduled")).toBe(true);

    // Annulation : rappels annulés, email d'annulation.
    await cancelAppointment({
      org,
      appointmentId: appt.id,
      by: "customer",
      actor: { kind: "customer" },
    });
    const final = await db
      .select()
      .from(notification)
      .where(eq(notification.appointmentId, appt.id));
    expect(
      final.filter((r) => r.type.startsWith("reminder") && r.status === "pending"),
    ).toHaveLength(0);
    expect(final.some((r) => r.type === "booking_cancelled")).toBe(true);
    await expect(
      cancelAppointment({
        org,
        appointmentId: appt.id,
        by: "customer",
        actor: { kind: "customer" },
      }),
    ).rejects.toThrow(/déjà annulé/);
  });

  it("notifications : Free = aucun email client, alerte équipe visible uniquement dans BookSync", async () => {
    const { svc, org } = await setup("free");
    const appt = await createAppointment({
      org,
      serviceId: svc.id,
      staffId: null,
      startsAt: nextDayAt(10),
      source: "online",
      customer: client(),
      actor: { kind: "customer" },
      enforceSchedule: true,
    });
    const rows = await db
      .select()
      .from(notification)
      .where(eq(notification.appointmentId, appt.id));
    expect(rows.map((r) => [r.type, r.channel, r.status])).toEqual([
      ["staff_new_booking", "in_app", "skipped"],
    ]);
  });

  it("un créneau libéré par une annulation redevient réservable", async () => {
    const { svc, org } = await setup();
    const startsAt = nextDayAt(16);
    const appt = await createAppointment({
      org,
      serviceId: svc.id,
      staffId: null,
      startsAt,
      source: "online",
      customer: client(),
      actor: { kind: "customer" },
      enforceSchedule: true,
    });
    await cancelAppointment({
      org,
      appointmentId: appt.id,
      by: "staff",
      actor: { kind: "customer" },
    });
    const again = await createAppointment({
      org,
      serviceId: svc.id,
      staffId: null,
      startsAt,
      source: "online",
      customer: client(),
      actor: { kind: "customer" },
      enforceSchedule: true,
    });
    expect(again.id).not.toBe(appt.id);
  });

  it("un employé inactif n'est plus proposé", async () => {
    const { svc, org, ctx } = await setup();
    await db.update(staff).set({ isBookable: false }).where(eq(staff.id, ctx.staffId!));
    await expect(
      createAppointment({
        org,
        serviceId: svc.id,
        staffId: null,
        startsAt: nextDayAt(10),
        source: "online",
        customer: client(),
        actor: { kind: "customer" },
        enforceSchedule: true,
      }),
    ).rejects.toThrow(/Aucun employé/);
    void ctxFor;
  });
});
