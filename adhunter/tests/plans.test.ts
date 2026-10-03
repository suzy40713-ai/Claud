import { describe, expect, it } from "vitest";

import { DEFAULT_PLANS, currentPeriodStart, effectivePlan, hasFeature, mergePlan, nextPeriodStart } from "@/lib/plans";

describe("effectivePlan", () => {
  const base = { plan: "pro" as const, status: "active" as const, current_period_end: null, source: "stripe" as const };
  it("returns free without subscription", () => expect(effectivePlan(null)).toBe("free"));
  it("grants the paid plan for active/trialing/past_due", () => {
    expect(effectivePlan(base)).toBe("pro");
    expect(effectivePlan({ ...base, status: "trialing" })).toBe("pro");
    expect(effectivePlan({ ...base, status: "past_due" })).toBe("pro");
  });
  it("falls back to free for canceled/unpaid/incomplete", () => {
    for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused", "inactive"] as const) {
      expect(effectivePlan({ ...base, status })).toBe("free");
    }
  });
  it("expires manual grants", () => {
    const now = new Date("2026-10-03T00:00:00Z");
    expect(effectivePlan({ ...base, source: "manual", current_period_end: "2026-10-01T00:00:00Z" }, now)).toBe("free");
    expect(effectivePlan({ ...base, source: "manual", current_period_end: "2026-11-01T00:00:00Z" }, now)).toBe("pro");
  });
});

describe("plan catalogue", () => {
  it("matches the commercial offer", () => {
    expect(DEFAULT_PLANS.free.priceCents).toBe(0);
    expect(DEFAULT_PLANS.pro.priceCents).toBe(1999);
    expect(DEFAULT_PLANS.business.priceCents).toBe(4999);
    expect(DEFAULT_PLANS.free.limits.ai_analyses_per_month).toBe(5);
    expect(DEFAULT_PLANS.pro.limits.ai_analyses_per_month).toBe(100);
    expect(DEFAULT_PLANS.business.limits.ai_analyses_per_month).toBe(500);
    expect(DEFAULT_PLANS.free.limits.collections_max).toBe(1);
    expect(DEFAULT_PLANS.pro.limits.collections_max).toBe(-1);
  });
  it("gates features by plan", () => {
    expect(hasFeature(DEFAULT_PLANS.free.features, "ad_creator")).toBe(false);
    expect(hasFeature(DEFAULT_PLANS.pro.features, "ad_creator")).toBe(true);
    expect(hasFeature(DEFAULT_PLANS.pro.features, "teams")).toBe(false);
    for (const f of DEFAULT_PLANS.pro.features) expect(hasFeature(DEFAULT_PLANS.business.features, f)).toBe(true);
  });
  it("merges DB overrides over defaults", () => {
    const merged = mergePlan(DEFAULT_PLANS.pro, { limits: { searches_per_month: 42 } });
    expect(merged.limits.searches_per_month).toBe(42);
    expect(merged.limits.ai_analyses_per_month).toBe(100);
  });
});

describe("quota periods", () => {
  it("uses calendar months in UTC", () => {
    const now = new Date("2026-12-31T23:59:00Z");
    expect(currentPeriodStart(now).toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(nextPeriodStart(now).toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
