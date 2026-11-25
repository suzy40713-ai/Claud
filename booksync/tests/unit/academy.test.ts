import { describe, expect, it } from "vitest";
import { ACADEMY, ALL_LESSONS, findLesson, nextLesson } from "@/domain/academy/lessons";
import { journey, profitability } from "@/domain/marketing/profitability";

describe("Académie", () => {
  it("leçons uniques, complètes, 3 gratuites", () => {
    expect(new Set(ALL_LESSONS.map((l) => l.id)).size).toBe(ALL_LESSONS.length);
    for (const l of ALL_LESSONS) {
      expect(l.paragraphs.length).toBeGreaterThanOrEqual(3);
      expect(l.keyPoints.length).toBeGreaterThanOrEqual(3);
      expect(l.action.href).toMatch(/^\/tableau-de-bord/);
    }
    expect(ALL_LESSONS.filter((l) => l.minPlan === "free")).toHaveLength(3);
    expect(ACADEMY[0].lessons.every((l) => l.minPlan === "free")).toBe(true);
    expect(JSON.stringify(ACADEMY)).not.toMatch(/garanti(e|s)? (de|un|des) (revenu|gain|vente)/i);
  });
  it("navigation entre leçons", () => {
    expect(findLesson("prix")?.minPlan).toBe("starter");
    expect(nextLesson(ALL_LESSONS[0].id)?.id).toBe(ALL_LESSONS[1].id);
    expect(nextLesson(ALL_LESSONS.at(-1)!.id)).toBeNull();
  });
});

describe("rentabiliser son abonnement", () => {
  it("jauge revenus / prix du forfait", () => {
    expect(profitability(0, 500)).toBeNull();
    expect(profitability(999, 0)).toMatchObject({ percent: 0, reached: false, remainingCents: 999 });
    expect(profitability(999, 500)).toMatchObject({ percent: 50, reached: false, remainingCents: 499 });
    expect(profitability(999, 2500)).toMatchObject({ percent: 100, reached: true, profitCents: 1501 });
  });
  it("prochaine étape du parcours", () => {
    const steps = journey({ hasProduct: true, hasAnalysis: false, hasStrategy: false, hasPlan: false, hasSale: false });
    expect(steps.find((s) => !s.done)?.id).toBe("analyse");
  });
});
