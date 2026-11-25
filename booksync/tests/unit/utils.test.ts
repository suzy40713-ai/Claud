import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("fusionne les classes Tailwind en conflit", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
  it("ignore les valeurs falsy", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});

import { trialDaysFor, TRIAL_DAYS } from "@/domain/billing/plans";

describe("pas d'essai gratuit", () => {
  it("aucun jour d'essai, premier abonnement compris", () => {
    expect(TRIAL_DAYS).toBe(0);
    for (const s of [null, undefined, "active", "trialing", "canceled", "past_due"])
      expect(trialDaysFor(s)).toBe(0);
  });
});
