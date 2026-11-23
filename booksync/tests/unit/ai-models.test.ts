import { describe, expect, it } from "vitest";
import { aiCostMicroUsd, monthStart } from "@/domain/ai/models";
import { productAnalysisSchema, productPayload } from "@/domain/marketing/analysis";

describe("modèles IA", () => {
  it("calcule le coût réel, cache compris", () => {
    expect(aiCostMicroUsd("claude-haiku-5-5", { input_tokens: 1_000_000, output_tokens: 0 })).toBe(100_000);
    expect(aiCostMicroUsd("claude-haiku-5-5", { input_tokens: 0, output_tokens: 1000 })).toBe(500);
    expect(
      aiCostMicroUsd("claude-haiku-5-5", {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 1_000_000,
        cache_creation_input_tokens: 1_000_000,
      }),
    ).toBe(10_000 + 125_000);
  });
  it("refuse un modèle sans tarif connu", () => {
    expect(() => aiCostMicroUsd("modele-inconnu", { input_tokens: 1, output_tokens: 1 })).toThrow();
  });
  it("début de mois en UTC", () => {
    expect(monthStart(new Date("2026-11-23T10:00:00Z")).toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("analyse de produit", () => {
  it("prépare les données sans identifiant interne", () => {
    const payload = productPayload({
      name: "Ebook",
      description: "Guide",
      priceCents: null,
      category: "numerique",
      benefits: null,
      targetAudience: null,
      url: null,
    });
    expect(payload).toMatchObject({ prix: "non indiqué", page: "aucune" });
    expect(Object.keys(payload)).not.toContain("id");
  });
  it("rejette une analyse mal formée", () => {
    expect(productAnalysisSchema.safeParse({ summary: "x" }).success).toBe(false);
  });
});
