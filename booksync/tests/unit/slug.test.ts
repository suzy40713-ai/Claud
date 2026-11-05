import { describe, expect, it } from "vitest";
import { RESERVED_SLUGS, slugify, validateSlug } from "@/domain/organization/slug";

describe("slugify", () => {
  it.each([
    ["Cabinet Martin", "cabinet-martin"],
    ["Clinique Vétérinaire Éloïse", "clinique-veterinaire-eloise"],
    ["L'Atelier de Chloé & Zoé", "l-atelier-de-chloe-et-zoe"],
    ["  Cœur   Santé  ", "coeur-sante"],
    ["Dr. Ngô — Kiné", "dr-ngo-kine"],
    ["!!!", ""],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("tronque à 48 caractères sans tiret final", () => {
    const slug = slugify("a".repeat(47) + " bcd");
    expect(slug.length).toBeLessThanOrEqual(48);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("validateSlug", () => {
  it("accepte une adresse valide", () => expect(validateSlug("cabinet-martin-2")).toBeNull());
  it("refuse trop court", () => expect(validateSlug("ab")).toBe("too_short"));
  it("refuse trop long", () => expect(validateSlug("a".repeat(49))).toBe("too_long"));
  it.each(["Cabinet", "cabinet--martin", "-cabinet", "cabinet-", "cabi net", "café"])(
    "refuse le format invalide %s",
    (s) => expect(validateSlug(s)).toBe("invalid"),
  );
  it("refuse toutes les adresses réservées aux pages de l'application", () => {
    for (const s of ["connexion", "inscription", "tableau-de-bord", "onboarding", "api"]) {
      expect(RESERVED_SLUGS.has(s)).toBe(true);
      expect(validateSlug(s)).toBe("reserved");
    }
  });
});
