import { describe, expect, it } from "vitest";
import { planIncludes } from "@/domain/autopilot/automations";
import { effectivePlan, PLAN_ORDER, PLANS, planAtLeast } from "@/domain/billing/plans";

describe("forfait Business", () => {
  it("coûte 49,99 € et inclut tout le forfait Pro", () => {
    expect(PLANS.business.priceCents).toBe(4999);
    expect(PLAN_ORDER).toEqual(["free", "starter", "pro", "business"]);
    expect(planAtLeast("business", "pro")).toBe(true);
    expect(planAtLeast("pro", "business")).toBe(false);
    expect(planIncludes("business", "pro")).toBe(true);
    for (const k of Object.keys(PLANS.pro.features) as Array<keyof typeof PLANS.pro.features>)
      expect(PLANS.business.features[k]).toBe(true);
  });
  it("a des limites supérieures ou égales à Pro", () => {
    const pro = PLANS.pro.limits;
    const biz = PLANS.business.limits;
    expect(biz.products).toBeGreaterThan(pro.products);
    expect(biz.members).toBeGreaterThanOrEqual(pro.members);
  });
  it("retombe sur Free sans abonnement valable", () => {
    expect(effectivePlan("business", "active").id).toBe("business");
    expect(effectivePlan("business", "canceled").id).toBe("free");
  });
});
