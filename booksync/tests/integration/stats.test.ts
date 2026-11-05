import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, sql as pg } from "@/db/client";
import { appointment, customer } from "@/db/schema";
import { addDays, localDateOf } from "@/domain/availability/engine";
import { createService } from "@/server/catalog/services";
import { getAnalytics, getOverview } from "@/server/stats";
import { makeOrg, nextDayAt } from "./factory";

afterAll(() => pg.end());

async function seed(plan: "free" | "pro") {
  const ctx = await makeOrg({ plan });
  const svc = await createService(ctx, {
    name: "Coupe",
    durationMinutes: 30,
    priceCents: 3000,
    staffIds: [ctx.staffId!],
  });
  const [c] = await db
    .insert(customer)
    .values({ organizationId: ctx.organization.id, firstName: "A", lastName: "B" })
    .returning();
  const base = {
    organizationId: ctx.organization.id,
    staffId: ctx.staffId!,
    serviceId: svc.id,
    customerId: c.id,
    source: "online" as const,
    serviceName: "Coupe",
    priceCents: 3000,
  };
  const past = (days: number, h: number) => nextDayAt(h, 0, -days);
  const rows = [
    { at: past(3, 9), status: "completed" as const },
    { at: past(3, 11), status: "completed" as const },
    { at: past(2, 9), status: "no_show" as const },
    { at: past(2, 11), status: "cancelled" as const },
    { at: past(1, 9), status: "confirmed" as const },
    { at: nextDayAt(10, 0, 2), status: "confirmed" as const },
  ];
  for (const r of rows) {
    const end = new Date(r.at.getTime() + 30 * 60_000);
    await db
      .insert(appointment)
      .values({ ...base, startsAt: r.at, endsAt: end, blockedUntil: end, status: r.status });
  }
  return ctx;
}

describe("statistiques (calculées depuis les rendez-vous réels)", () => {
  it("totaux, CA enregistré, taux d'annulation et d'absence", async () => {
    const ctx = await seed("pro");
    const today = localDateOf(new Date(), "Europe/Paris");
    const a = await getAnalytics(ctx, { from: addDays(today, -10), to: today });
    expect(a.advanced).toBe(true);
    // 5 rendez-vous sur la période (hors futur), dont 1 annulé.
    expect(a.totals.bookings).toBe(4);
    // CA = 2 honorés + 1 passé confirmé = 3 × 30 € (absence et annulation exclues).
    expect(a.totals.revenueCents).toBe(9000);
    expect(a.totals.cancellationRate).toBeCloseTo(1 / 5);
    expect(a.totals.noShowRate).toBeCloseTo(1 / 4);
    expect(a.services[0]).toMatchObject({ name: "Coupe", n: 4 });
    expect(a.staff[0]).toMatchObject({ n: 4, noShow: 1, revenue: 9000 });
    expect(a.monthly.length).toBeGreaterThanOrEqual(1);
    expect(a.weekdays).toHaveLength(7);
  });

  it("forfait Free : statistiques basiques uniquement", async () => {
    const ctx = await seed("free");
    const today = localDateOf(new Date(), "Europe/Paris");
    const a = await getAnalytics(ctx, { from: addDays(today, -10), to: today });
    expect(a.advanced).toBe(false);
    expect(a.staff).toEqual([]);
    expect(a.totals.bookings).toBe(4);
  });

  it("vue générale : prochains rendez-vous, clients, série sur 30 jours", async () => {
    const ctx = await seed("pro");
    const o = await getOverview(ctx);
    expect(o.customers).toBe(1);
    expect(o.upcoming).toHaveLength(1);
    expect(o.series).toHaveLength(30);
    expect(o.series.reduce((s, d) => s + d.count, 0)).toBe(4);
    const [n] = await db
      .select()
      .from(appointment)
      .where(eq(appointment.organizationId, ctx.organization.id));
    expect(n).toBeTruthy();
  });
});
