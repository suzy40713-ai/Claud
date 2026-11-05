import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { emailMessage, notification, organization } from "@/db/schema";
import { cancelAppointment, createAppointment } from "@/server/booking/book";
import { createService } from "@/server/catalog/services";
import { makeOrg, nextDayAt, uid } from "./factory";

afterAll(() => pg.end());
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function proBooking() {
  const ctx = await makeOrg({ plan: "pro" });
  const svc = await createService(ctx, {
    name: "Soin",
    durationMinutes: 60,
    priceCents: 5000,
    staffIds: [ctx.staffId!],
  });
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, ctx.organization.id));
  const email = `${uid()}@example.com`;
  const appt = await createAppointment({
    org,
    serviceId: svc.id,
    staffId: null,
    startsAt: nextDayAt(10, 0, 3),
    source: "online",
    customer: { firstName: "Nina", lastName: "Lopez", email, phone: null },
    actor: { kind: "customer" },
    enforceSchedule: true,
  });
  return { org, appt, email };
}

async function loadDispatcher() {
  vi.resetModules();
  return (await import("@/server/notifications/dispatch")).processDueNotifications;
}

describe("envoi des notifications et rappels", () => {
  it("rappel dû envoyé une seule fois, avec le bon contenu", async () => {
    const { appt, email } = await proBooking();
    await db
      .update(notification)
      .set({ scheduledFor: new Date(Date.now() - 1000) })
      .where(eq(notification.appointmentId, appt.id));
    const process = await loadDispatcher();
    await process();
    await process(); // second passage : rien de plus
    const rows = await db
      .select()
      .from(notification)
      .where(eq(notification.appointmentId, appt.id));
    expect(rows.filter((r) => r.audience === "customer").every((r) => r.status === "sent")).toBe(
      true,
    );
    const mails = await db.select().from(emailMessage).where(eq(emailMessage.to, email));
    expect(mails.map((m) => m.template).sort()).toEqual([
      "booking_confirmation",
      "reminder_24h",
      "reminder_2h",
    ]);
    const reminder = mails.find((m) => m.template === "reminder_24h")!;
    expect(reminder.subject).toMatch(/^Rappel : rendez-vous demain à 10:00/);
    expect(reminder.text).toContain("Soin");
    expect(reminder.text).toMatch(/\/rdv\/[0-9a-f-]{36}\./);
  });

  it("rappel d'un rendez-vous annulé : jamais envoyé", async () => {
    const { org, appt, email } = await proBooking();
    await cancelAppointment({
      org,
      appointmentId: appt.id,
      by: "staff",
      actor: { kind: "staff", email: "x@example.com" },
    });
    // Même si un rappel était resté en file, il serait ignoré à l'envoi.
    await db
      .update(notification)
      .set({ status: "pending", scheduledFor: new Date(Date.now() - 1000) })
      .where(eq(notification.appointmentId, appt.id));
    const process = await loadDispatcher();
    await process();
    const rows = await db
      .select()
      .from(notification)
      .where(eq(notification.appointmentId, appt.id));
    for (const r of rows.filter((r) => r.type.startsWith("reminder")))
      expect(r.status).toBe("skipped");
    const mails = await db.select().from(emailMessage).where(eq(emailMessage.to, email));
    expect(mails.some((m) => m.template.startsWith("reminder"))).toBe(false);
  });

  it("échec du fournisseur : nouvelle tentative programmée, puis échec définitif", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ message: "Service indisponible" }), { status: 503 }),
        ),
    );
    const { appt } = await proBooking();
    const process = await loadDispatcher();
    await process();
    let [conf] = await db
      .select()
      .from(notification)
      .where(eq(notification.appointmentId, appt.id))
      .then((r) => r.filter((n) => n.type === "booking_confirmation"));
    expect(conf.status).toBe("pending");
    expect(conf.attempts).toBe(1);
    expect(conf.scheduledFor.getTime()).toBeGreaterThan(Date.now());
    // Après 5 tentatives : échec définitif.
    await db
      .update(notification)
      .set({ attempts: 4, scheduledFor: new Date(Date.now() - 1000) })
      .where(eq(notification.id, conf.id));
    await process();
    [conf] = await db.select().from(notification).where(eq(notification.id, conf.id));
    expect(conf.status).toBe("failed");
  });
});
