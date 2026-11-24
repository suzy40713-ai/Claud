import { describe, expect, it } from "vitest";
import { productAnalysisSchema } from "@/domain/marketing/analysis";
import { analysisTemplate, runTemplate, type ProductInfo } from "@/domain/marketing/templates";
import { fit } from "@/domain/marketing/templates/ad";
import { benefitList } from "@/domain/marketing/templates/common";
import { pageChecks } from "@/domain/marketing/templates/sales";
import { TOOLS, type ToolKind } from "@/domain/marketing/tools";
import { defaultOptionValues } from "@/domain/marketing/tools/options";
import { checkStrategy, type Strategy } from "@/domain/marketing/tools/strategy";
import type { AdOutput } from "@/domain/marketing/tools/ad";

const full: ProductInfo = {
  name: "Bougies Lumi",
  description: "Bougies parfumées coulées à la main en petites séries. Cire végétale.",
  priceCents: 2490,
  category: "physique",
  benefits: "Cire végétale\nParfum qui dure, fabriquées en France",
  targetAudience: "Les amoureux de déco cosy",
  url: "https://lumi.fr",
};
const bare: ProductInfo = {
  name: "Coaching",
  description: "Un accompagnement pour lancer son activité.",
  priceCents: null,
  category: "service",
  benefits: null,
  targetAudience: null,
  url: null,
};

describe("modèles gratuits du copilote", () => {
  it("tous les outils produisent un résultat valide, quelle que soit la fiche", () => {
    for (const p of [full, bare])
      for (const kind of Object.keys(TOOLS) as ToolKind[])
        for (let seed = 0; seed < 4; seed++) {
          const t = TOOLS[kind];
          const out = runTemplate(kind, p, defaultOptionValues(t.options), seed);
          expect(t.schema.safeParse(out).success).toBe(true);
        }
    expect(productAnalysisSchema.safeParse(analysisTemplate(bare)).success).toBe(true);
  });

  it("l'analyse distingue l'information fournie des hypothèses", () => {
    const a = analysisTemplate(full);
    expect(a.strengths.every((s) => s.basis === "fourni")).toBe(true);
    expect(a.audiences[0]).toMatchObject({ name: "Les amoureux de déco cosy", basis: "fourni" });
    expect(a.audiences.slice(1).every((x) => x.basis === "hypothese")).toBe(true);
    const b = analysisTemplate(bare);
    expect(b.weaknesses.map((w) => w.text).join(" ")).toMatch(/prix/);
    expect(JSON.stringify(b)).not.toMatch(/\d+\s?%/); // aucun pourcentage inventé
  });

  it("stratégie : 30 jours de 3 actions, pas de publicité sans budget", () => {
    const free = runTemplate("strategy", full, { objective: "ventes", time: "1-2h", budget: "0", channels: ["tiktok"] }, 0) as Strategy;
    expect(checkStrategy(free)).toBeNull();
    expect(free.days.every((d) => d.actions.length === 3)).toBe(true);
    expect(JSON.stringify(free)).not.toMatch(/publicité test/);
    const paid = runTemplate("strategy", full, { objective: "ventes", time: "5h+", budget: "50", channels: ["instagram", "email"] }, 0) as Strategy;
    expect(paid.days[21].actions[2].title).toMatch(/publicité test \(2 €/);
    expect(paid.channels.map((c) => c.channel)).toEqual(["Instagram", "Email / newsletter"]);
  });

  it("Google Ads : titres ≤ 30 et descriptions ≤ 90 caractères, mots-clés", () => {
    for (const style of ["probleme", "demo", "story", "avant-apres", "humour"]) {
      const ad = runTemplate("ad", full, { platform: "google", style, offer: "Livraison offerte dès 30 €" }, 0) as AdOutput;
      for (const v of ad.variants) {
        expect(v.headline.length).toBeLessThanOrEqual(30);
        expect(v.primaryText.length).toBeLessThanOrEqual(90);
        expect(v.script).toEqual([]);
      }
      expect(ad.keywords.length).toBeGreaterThan(0);
    }
    expect(fit("Un titre beaucoup trop long pour Google Ads", 30).length).toBeLessThanOrEqual(30);
  });

  it("lit les avantages et vérifie le texte collé", () => {
    expect(benefitList(full)).toEqual(["Cire végétale", "Parfum qui dure", "fabriquées en France"]);
    expect(pageChecks("Bougie 24 € — livraison 48 h. Ajouter au panier")).toMatchObject({ price: true, delivery: true, cta: true, reviews: false });
  });
});
