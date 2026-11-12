import { afterAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { autopilotAction, dailySummary, emailMessage, member, organization } from "@/db/schema";
import { addDays, localDateOf, localMinuteToInstant } from "@/domain/availability/engine";
import { setAutomation } from "@/server/autopilot/rules";
import { buildDailySummary, sendDueDailySummaries } from "@/server/autopilot/daily-summary";
import { createAppointment } from "@/server/booking/book";
import { createService } from "@/server/catalog/services";
import { makeOrg, makeUser, uid } from "./factory";

afterAll(() => pg.end());

const TZ = "Europe/Paris";
const today = localDateOf(new Date(), TZ);
const at = (date: string, hour: number) => localMinuteToInstant(date, hour * 60, TZ)!;

async function setup(plan: "starter" | "pro" = "pro") {
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
  const tomorrow = addDays(today, 1);
  await createAppointment({
    org,
    serviceId: svc.id,
    staffId: null,
    startsAt: at(tomorrow, 10),
    source: "manual",
    customer: { firstName: "Tom", lastName: "Roy", email: `${uid()}@example.com`, phone: null },
    actor: { kind: "staff", email: ctx.user.email },
    enforceSchedule: false,
  });
  return { ctx, org };
}

const summariesTo = (email: string) =>
  db
    .select()
    .from(emailMessage)
    .where(
      and(eq(emailMessage.to, email.toLowerCase()), eq(emailMessage.template, "daily_summary")),
    );

describe("résumé quotidien", () => {
  it("contenu réel : rendez-vous du lendemain et créneaux encore libres", async () => {
    const { org } = await setup();
    const s = await buildDailySummary(org);
    expect(s.appointments).toEqual([
      expect.objectContaining({ time: "10:00", customer: "Tom Roy", service: "Coupe" }),
    ]);
    // Horaires de test : 9 h – 18 h, créneaux de 30 min (sauf celui de 10 h).
    expect(s.freeSlots?.count).toBeGreaterThan(10);
    expect(s.freeSlots?.times).not.toContain("10:00");
  });

  it("envoyé une seule fois après 19 h, au propriétaire et aux administrateurs vérifiés", async () => {
    const { ctx } = await setup();
    const admin = await makeUser("Admin");
    const employee = await makeUser("Employé");
    await db.insert(member).values([
      { organizationId: ctx.organization.id, userId: admin.id, role: "admin" },
      { organizationId: ctx.organization.id, userId: employee.id, role: "employee" },
    ]);

    await sendDueDailySummaries(at(today, 18));
    expect(await summariesTo(ctx.user.email)).toHaveLength(0);

    await sendDueDailySummaries(at(today, 19));
    await sendDueDailySummaries(new Date(at(today, 19).getTime() + 5 * 60_000));
    const mails = await summariesTo(ctx.user.email);
    expect(mails).toHaveLength(1);
    expect(mails[0].subject).toMatch(/^Demain : 1 rendez-vous — /);
    expect(await summariesTo(admin.email)).toHaveLength(1);
    expect(await summariesTo(employee.email)).toHaveLength(0);
    const [row] = await db
      .select()
      .from(dailySummary)
      .where(eq(dailySummary.organizationId, ctx.organization.id));
    expect(row).toMatchObject({ forDate: addDays(today, 1), recipients: 2 });
    const log = await db
      .select()
      .from(autopilotAction)
      .where(
        and(
          eq(autopilotAction.organizationId, ctx.organization.id),
          eq(autopilotAction.kind, "daily_summary.sent"),
        ),
      );
    expect(log).toHaveLength(1);
  });

  it("forfait Starter ou automatisation désactivée : aucun envoi", async () => {
    const starter = await setup("starter");
    const off = await setup("pro");
    await setAutomation(off.ctx, "daily_summary", false);
    await sendDueDailySummaries(at(today, 20));
    expect(await summariesTo(starter.ctx.user.email)).toHaveLength(0);
    expect(await summariesTo(off.ctx.user.email)).toHaveLength(0);
  });
});
