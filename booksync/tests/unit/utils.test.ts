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

describe("1er mois offert", () => {
  it("30 jours d'essai pour un premier abonnement uniquement", () => {
    expect(TRIAL_DAYS).toBe(30);
    expect(trialDaysFor(null)).toBe(30);
    expect(trialDaysFor(undefined)).toBe(30);
    // Déjà abonné, ou abonnement résilié : pas de nouvel essai.
    for (const s of ["active", "trialing", "canceled", "past_due", "incomplete_expired"])
      expect(trialDaysFor(s)).toBe(0);
  });
});
