import { afterAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { autopilotAction, member, notification, organization } from "@/db/schema";
import { cancelAppointment, createAppointment } from "@/server/booking/book";
import { createService } from "@/server/catalog/services";
import { getAutopilotOverview, listActivity, listScheduled } from "@/server/autopilot/activity";
import { listAutomations, setAutomation } from "@/server/autopilot/rules";
import { ctxFor, makeOrg, makeUser, nextDayAt, uid } from "./factory";

afterAll(() => pg.end());

async function setup(plan: "free" | "starter" | "pro") {
  const ctx = await makeOrg({ plan });
  const svc = await createService(ctx, {
    name: "Coupe",
    durationMinutes: 30,
    priceCents: 2500,
    staffIds: [ctx.staffId!],
  });
  const loadOrg = async () =>
    (await db.select().from(organization).where(eq(organization.id, ctx.organization.id)))[0];
  const book = async (hour: number) =>
    createAppointment({
      org: await loadOrg(),
      serviceId: svc.id,
      staffId: null,
      startsAt: nextDayAt(hour, 0, 3),
      source: "online",
      customer: {
        firstName: "Léa",
        lastName: "Durand",
        email: `${uid()}@example.com`,
        phone: null,
      },
      actor: { kind: "customer" },
      enforceSchedule: true,
    });
  return { ctx, book, loadOrg };
}

const typesOf = async (appointmentId: string) =>
  (await db.select().from(notification).where(eq(notification.appointmentId, appointmentId)))
    .map((r) => r.type)
    .sort();

describe("Autopilot : automatisations", () => {
  it("Starter : confirmation et rappels actifs par défaut", async () => {
    const { book } = await setup("starter");
    const appt = await book(10);
    expect(await typesOf(appt.id)).toEqual([
      "booking_confirmation",
      "reminder_24h",
      "reminder_2h",
      "staff_new_booking",
    ]);
  });

  it("désactiver une automatisation empêche sa programmation et l'inscrit dans l'historique", async () => {
    const { ctx, book } = await setup("starter");
    await setAutomation(ctx, "reminder_2h", false);
    await setAutomation(ctx, "booking_confirmation", false);
    await setAutomation(ctx, "staff_alerts", false);
    await setAutomation(ctx, "staff_alerts", false); // sans changement : pas de doublon au journal
    const appt = await book(11);
    expect(await typesOf(appt.id)).toEqual(["reminder_24h"]);

    const log = await db
      .select()
      .from(autopilotAction)
      .where(eq(autopilotAction.organizationId, ctx.organization.id));
    expect(log).toHaveLength(3);
    expect(log.map((l) => l.summary)).toContain(
      `Rappel 2 heures avant désactivée par ${ctx.user.name}`,
    );
    const states = await listAutomations(ctx);
    expect(states.find((s) => s.key === "reminder_2h")).toMatchObject({ active: false });
  });

  it("annulation : email au client selon la règle « notification d'annulation »", async () => {
    const { ctx, book, loadOrg } = await setup("starter");
    await setAutomation(ctx, "cancellation_notice", false);
    const appt = await book(12);
    await cancelAppointment({
      org: await loadOrg(),
      appointmentId: appt.id,
      by: "customer",
      actor: { kind: "customer" },
    });
    expect(await typesOf(appt.id)).not.toContain("booking_cancelled");
  });

  it("un rappel déjà programmé n'est pas envoyé si l'automatisation est coupée entre-temps", async () => {
    const { ctx, book } = await setup("starter");
    const appt = await book(13);
    await setAutomation(ctx, "reminder_24h", false);
    await db
      .update(notification)
      .set({ scheduledFor: new Date(Date.now() - 1000) })
      .where(and(eq(notification.appointmentId, appt.id), eq(notification.type, "reminder_24h")));
    vi.resetModules();
    const { processDueNotifications } = await import("@/server/notifications/dispatch");
    await processDueNotifications();
    const [r] = await db
      .select()
      .from(notification)
      .where(and(eq(notification.appointmentId, appt.id), eq(notification.type, "reminder_24h")));
    expect(r.status).toBe("skipped");
    expect(r.lastError).toBe("Automatisation désactivée dans Autopilot");
  });

  it("forfait et verrous : refus côté serveur", async () => {
    const { ctx } = await setup("free");
    await expect(setAutomation(ctx, "reminder_24h", true)).rejects.toThrow(/forfait Starter/);
    await expect(setAutomation(ctx, "conflict_protection", false)).rejects.toThrow(
      /toujours active/,
    );
    await expect(setAutomation(ctx, "inconnue", true)).rejects.toThrow(/inconnue/);
  });

  it("permissions : l'administrateur consulte, seul le propriétaire modifie ; l'employé n'a pas accès", async () => {
    const { ctx } = await setup("pro");
    const admin = await makeUser("Admin");
    const employee = await makeUser("Employé");
    await db.insert(member).values([
      { organizationId: ctx.organization.id, userId: admin.id, role: "admin" },
      { organizationId: ctx.organization.id, userId: employee.id, role: "employee" },
    ]);
    const adminCtx = await ctxFor(admin, ctx.organization.id);
    const employeeCtx = await ctxFor(employee, ctx.organization.id);
    expect(adminCtx.role).toBe("admin");
    await expect(listAutomations(adminCtx)).resolves.toHaveLength(9);
    await expect(setAutomation(adminCtx, "reminder_2h", false)).rejects.toThrow(/droits/);
    await expect(listActivity(employeeCtx)).rejects.toThrow(/droits/);
  });

  it("isolation : le journal et les indicateurs ne montrent que l'entreprise active", async () => {
    const a = await setup("starter");
    const b = await setup("starter");
    await a.book(10);
    await setAutomation(b.ctx, "reminder_2h", false);
    const activityB = await listActivity(b.ctx);
    expect(activityB).toHaveLength(1);
    expect(activityB[0]).toMatchObject({ origin: "user", status: "done" });
    const overviewA = await getAutopilotOverview(a.ctx);
    expect(overviewA.scheduled).toBe(2); // rappels 24 h et 2 h à venir
    expect(overviewA.toConfirm).toBe(0);
    expect((await listScheduled(a.ctx)).map((s) => s.type).sort()).toEqual([
      "reminder_24h",
      "reminder_2h",
    ]);
    expect(await listScheduled(b.ctx)).toHaveLength(0);
  });
});
