import { describe, expect, it } from "vitest";
import {
  categoryLabel,
  normalizeProductUrl,
  parsePriceInput,
  productSchema,
} from "@/domain/marketing/product";

const valid = {
  name: "Bougies Lumi",
  description: "Bougies parfumées coulées à la main en petites séries.",
  price: "24,90",
  category: "physique" as const,
  benefits: "",
  targetAudience: "",
  url: "maboutique.fr/lumi",
};

describe("produits du copilote marketing", () => {
  it("lit un prix en euros, accepte le vide, refuse le texte", () => {
    expect(parsePriceInput("24,90 €")).toBe(2490);
    expect(parsePriceInput("")).toBeNull();
    expect(parsePriceInput("gratuit")).toBe("invalid");
    expect(parsePriceInput("12,345")).toBe("invalid");
  });

  it("normalise le lien et refuse les liens douteux", () => {
    expect(normalizeProductUrl("maboutique.fr/lumi")).toBe("https://maboutique.fr/lumi");
    expect(normalizeProductUrl("")).toBeNull();
    expect(normalizeProductUrl("javascript:alert(1)")).toBe("invalid");
    expect(normalizeProductUrl("https://user:pass@site.fr")).toBe("invalid");
  });

  it("valide un produit complet et nettoie les champs facultatifs", () => {
    const p = productSchema.parse(valid);
    expect(p).toMatchObject({
      priceCents: 2490,
      url: "https://maboutique.fr/lumi",
      benefits: null,
    });
  });

  it("refuse une description trop courte ou un prix invalide", () => {
    expect(productSchema.safeParse({ ...valid, description: "court" }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, price: "abc" }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, category: "inconnue" }).success).toBe(false);
  });

  it("libellé de catégorie", () => {
    expect(categoryLabel("numerique")).toBe("Produit numérique");
  });
});
