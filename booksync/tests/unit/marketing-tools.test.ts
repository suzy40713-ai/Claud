import { describe, expect, it } from "vitest";
import { TOOLS } from "@/domain/marketing/tools";
import { defaultOptionValues, parseToolOptions } from "@/domain/marketing/tools/options";
import { checkStrategy, type Strategy } from "@/domain/marketing/tools/strategy";

describe("outils du copilote — choix", () => {
  it("les valeurs par défaut de chaque outil sont valides", () => {
    for (const t of Object.values(TOOLS))
      expect(() => parseToolOptions(t.options, defaultOptionValues(t.options))).not.toThrow();
  });
  it("traduit les choix en libellés pour le modèle", () => {
    const { labelled } = parseToolOptions(TOOLS.strategy.options, {
      objective: "ventes",
      time: "1-2h",
      budget: "0",
      channels: ["tiktok", "email"],
    });
    expect(labelled).toMatchObject({
      "Objectif principal": "Faire mes premières ventes",
      "Canaux que vous voulez utiliser": ["TikTok", "Email / newsletter"],
    });
  });
  it("refuse une valeur inconnue, trop de canaux ou aucun canal", () => {
    const base = { objective: "ventes", time: "1-2h", budget: "0", channels: ["tiktok"] };
    expect(() => parseToolOptions(TOOLS.strategy.options, { ...base, budget: "1000000" })).toThrow();
    expect(() =>
      parseToolOptions(TOOLS.strategy.options, {
        ...base,
        channels: ["tiktok", "instagram", "facebook", "email"],
      }),
    ).toThrow(/entre 1 et 3/);
    expect(() => parseToolOptions(TOOLS.strategy.options, { ...base, channels: [] })).toThrow();
    expect(() =>
      parseToolOptions(TOOLS.strategy.options, { ...base, channels: ["tiktok", "tiktok"] }),
    ).toThrow();
  });
  it("limite la longueur du texte collé (Sales Booster)", () => {
    expect(() =>
      parseToolOptions(TOOLS.sales.options, { problem: "inconnu", pageText: "x".repeat(8001) }),
    ).toThrow(/8000/);
    expect(parseToolOptions(TOOLS.sales.options, { problem: "inconnu" }).labelled).toMatchObject({
      "Texte de votre page de vente (facultatif)": "non fourni",
    });
  });
});

describe("stratégie 30 jours", () => {
  const day = (d: number) => ({
    day: d,
    theme: "t",
    actions: [{ title: "a", detail: "b", channel: "TikTok" }],
  });
  const s = (days: number[]) =>
    ({ days: days.map(day) }) as unknown as Strategy;
  it("exige les 30 jours", () => {
    expect(checkStrategy(s(Array.from({ length: 30 }, (_, i) => i + 1)))).toBeNull();
    expect(checkStrategy(s(Array.from({ length: 29 }, (_, i) => i + 1)))).toMatch(/jour 30/);
  });
});
