import { describe, expect, it } from "vitest";
import { byChannel, ratios, resultSchema, totals } from "@/domain/marketing/results";

const row = (o: Partial<Parameters<typeof totals>[0][number]>) => ({
  channel: "tiktok",
  spendCents: 0,
  impressions: null,
  clicks: null,
  sales: null,
  revenueCents: null,
  ...o,
});

describe("statistiques marketing", () => {
  it("ne calcule un indicateur que si les données existent", () => {
    const t = totals([row({ spendCents: 1000 })]);
    expect(ratios(t)).toEqual({ clickRate: null, conversionRate: null, costPerSaleCents: null, roas: null });
    const t2 = totals([
      row({ spendCents: 2000, impressions: 1000, clicks: 50, sales: 2, revenueCents: 5000 }),
      row({ channel: "instagram", spendCents: 0, clicks: 10 }),
    ]);
    expect(t2).toMatchObject({ spendCents: 2000, clicks: 60, sales: 2, revenueCents: 5000, entries: 2 });
    expect(ratios(t2)).toEqual({ clickRate: 6, conversionRate: 3.3, costPerSaleCents: 1000, roas: 2.5 });
  });
  it("regroupe par canal", () => {
    const c = byChannel([row({ spendCents: 100 }), row({ spendCents: 50 }), row({ channel: "email" })]);
    expect(c.map((x) => [x.channel, x.totals.spendCents])).toEqual([
      ["tiktok", 150],
      ["email", 0],
    ]);
  });
  it("valide la saisie", () => {
    const ok = resultSchema.parse({ date: "2026-11-20", channel: "tiktok", spend: "12,50", sales: "3" });
    expect(ok).toMatchObject({ spend: 1250, sales: 3, clicks: null, productId: null });
    expect(resultSchema.safeParse({ date: "2026-11-20", channel: "tiktok" }).success).toBe(false);
    expect(resultSchema.safeParse({ date: "2026-11-20", channel: "x", spend: "1" }).success).toBe(false);
    expect(
      resultSchema.safeParse({ date: "2026-11-20", channel: "tiktok", impressions: "5", clicks: "9" }).success,
    ).toBe(false);
    expect(resultSchema.safeParse({ date: "2026-11-20", channel: "tiktok", sales: "-1" }).success).toBe(false);
  });
});
