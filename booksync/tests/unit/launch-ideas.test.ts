import { describe, expect, it } from "vitest";
import { findIdea, ideaToProduct, TALENTS } from "@/domain/launch/ideas";
import { productSchema } from "@/domain/marketing/product";

describe("idées pour débutants", () => {
  const ideas = TALENTS.flatMap((t) => t.ideas);

  it("chaque idée devient une fiche produit valide", () => {
    for (const idea of ideas) {
      const p = productSchema.parse(ideaToProduct(idea));
      expect(p.priceCents).toBe(idea.priceCents);
      expect(idea.firstSteps).toHaveLength(3);
    }
  });

  it("identifiants uniques et recherche", () => {
    expect(new Set(ideas.map((i) => i.id)).size).toBe(ideas.length);
    expect(findIdea("montage")?.title).toMatch(/Montage/);
    expect(findIdea("inconnue")).toBeNull();
  });

  it("aucune promesse de revenu", () => {
    expect(JSON.stringify(TALENTS)).not.toMatch(/garanti|€ par mois assurés|devenir riche/i);
  });
});
