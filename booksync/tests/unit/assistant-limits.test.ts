import { describe, expect, it } from "vitest";
import { costMicroUsd, quotaRefusal } from "@/domain/assistant/limits";

describe("assistant : coût et quotas", () => {
  it("coût réel d'un appel Claude Haiku 5.5 (en millionièmes de dollar)", () => {
    // 3 000 jetons d'entrée à 0,10 $/M + 500 de sortie à 0,50 $/M = 0,00055 $
    expect(costMicroUsd({ input_tokens: 3000, output_tokens: 500 })).toBe(550);
    // Lecture de cache : 0,1 × le tarif d'entrée ; écriture (5 min) : 1,25 ×
    expect(
      costMicroUsd({
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 10_000,
        cache_creation_input_tokens: 1000,
      }),
    ).toBe(225);
    // Au-delà de 100 000 jetons d'entrée : tarif supérieur
    expect(costMicroUsd({ input_tokens: 200_000, output_tokens: 0 })).toBe(100_000);
  });

  it("refus explicites, le plafond de dépense en premier", () => {
    const ok = {
      orgQuestionsThisMonth: 10,
      userQuestionsToday: 2,
      globalCostMicroUsdThisMonth: 1_000_000,
      monthlyBudgetUsd: 5,
    };
    expect(quotaRefusal(ok)).toBeNull();
    expect(quotaRefusal({ ...ok, globalCostMicroUsdThisMonth: 5_000_000 })).toMatch(/plafond/);
    expect(quotaRefusal({ ...ok, orgQuestionsThisMonth: 300 })).toMatch(/300 questions/);
    expect(quotaRefusal({ ...ok, userQuestionsToday: 40 })).toMatch(/aujourd'hui/);
    expect(quotaRefusal({ ...ok, monthlyBudgetUsd: 0 })).toMatch(/plafond/);
  });
});
