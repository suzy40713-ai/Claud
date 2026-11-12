import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { appointment, member, organization } from "@/db/schema";
import { createAppointment } from "@/server/booking/book";
import { createService } from "@/server/catalog/services";
import { getInsights } from "@/server/insights";
import { ctxFor, makeOrg, makeUser, nextDayAt, uid } from "./factory";

afterAll(() => pg.end());

describe("analyses (base réelle)", () => {
  it("calcule à partir des rendez-vous de l'entreprise uniquement, réservé au forfait Pro", async () => {
    const ctx = await makeOrg({ plan: "pro" });
    const other = await makeOrg({ plan: "pro" });
    const svc = await createService(ctx, {
      name: "Massage",
      durationMinutes: 60,
      priceCents: 6000,
      staffIds: [ctx.staffId!],
    });
    const [org] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, ctx.organization.id));
    const email = `${uid()}@example.com`;
    for (let i = 0; i < 3; i++) {
      const a = await createAppointment({
        org,
        serviceId: svc.id,
        staffId: null,
        startsAt: nextDayAt(10 + i, 0, 2),
        source: "manual",
        customer: { firstName: "Ana", lastName: "Silva", email, phone: null },
        actor: { kind: "staff", email: ctx.user.email },
        enforceSchedule: false,
      });
      // Rendez-vous déplacé dans le passé et honoré (historique réel).
      await db
        .update(appointment)
        .set({
          startsAt: new Date(Date.now() - (10 + i * 20) * 86_400_000),
          endsAt: new Date(Date.now() - (10 + i * 20) * 86_400_000 + 3_600_000),
          blockedUntil: new Date(Date.now() - (10 + i * 20) * 86_400_000 + 3_600_000),
          status: "completed",
        })
        .where(eq(appointment.id, a.id));
    }
    const insights = await getInsights(ctx);
    expect(insights.services).toEqual([
      expect.objectContaining({ name: "Massage", count: 3, revenueCents: 18000 }),
    ]);
    expect(insights.regulars).toEqual([expect.objectContaining({ name: "Ana Silva", visits: 3 })]);
    expect(insights.enoughData).toBe(false);

    const empty = await getInsights(other);
    expect(empty.services).toEqual([]);

    const starter = await makeOrg({ plan: "starter" });
    await expect(getInsights(starter)).rejects.toThrow(/forfait Pro/);
    const employee = await makeUser("Employé");
    await db
      .insert(member)
      .values({ organizationId: ctx.organization.id, userId: employee.id, role: "employee" });
    await expect(getInsights(await ctxFor(employee, ctx.organization.id))).rejects.toThrow(
      /droits/,
    );
  });
});
