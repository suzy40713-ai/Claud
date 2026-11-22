import { describe, expect, it } from "vitest";
import { ACTIVITIES } from "@/domain/activities";
import {
  buildLaunchPlan,
  instagramBio,
  LAUNCH_ACTIVITIES,
  nameIdeas,
  roundPrice,
  suggestedServices,
} from "@/domain/launch/plan";

const base = {
  activity: "onglerie" as const,
  firstName: "  inès ",
  city: "lyon",
  place: "domicile" as const,
  level: "debutant" as const,
};

describe("lance ton activité", () => {
  it("propose des noms personnalisés, sans doublon", () => {
    const names = nameIdeas(base);
    expect(names).toContain("Inès Nails");
    expect(names).toContain("Lyon Nails");
    expect(names).toContain("Inès Nails à domicile");
    expect(new Set(names).size).toBe(names.length);
  });

  it("fonctionne sans prénom ni ville", () => {
    const names = nameIdeas({ ...base, firstName: "", city: "" });
    expect(names.length).toBeGreaterThan(3);
    expect(names.every((n) => n.trim().length > 0)).toBe(true);
  });

  it("baisse un peu les prix quand on débute, arrondis à 5 €", () => {
    const pro = suggestedServices("onglerie", "confirme");
    const beginner = suggestedServices("onglerie", "debutant");
    expect(pro[0].priceCents).toBe(3500);
    expect(beginner[0].priceCents).toBe(3000);
    expect(beginner.every((s) => s.priceCents % 500 === 0)).toBe(true);
  });

  it("arrondit les prix et garde la gratuité", () => {
    expect(roundPrice(0)).toBe(0);
    expect(roundPrice(120)).toBe(500);
    expect(roundPrice(2_975)).toBe(3_000);
  });

  it("écrit une bio Instagram avec la ville", () => {
    expect(instagramBio(base)).toBe(
      "💅 Prothésiste ongulaire à domicile · Lyon et alentours\n📅 Réservation en ligne 24h/24\n👇 Prends ton rendez-vous ici",
    );
    expect(instagramBio({ ...base, place: "chez-moi" })).toContain("à Lyon");
  });

  it("chaque métier de l'outil existe dans BookSync et produit un plan complet", () => {
    for (const activity of LAUNCH_ACTIVITIES) {
      expect(ACTIVITIES.some((a) => a.value === activity)).toBe(true);
      const plan = buildLaunchPlan({ ...base, activity });
      expect(plan.services.length).toBeGreaterThan(0);
      expect(plan.checklist[0].link).toBe("https://formalites.entreprises.gouv.fr");
      expect(plan.videos).toHaveLength(3);
    }
  });

  it("rappelle la qualification pour les métiers réglementés", () => {
    const coiffure = buildLaunchPlan({ ...base, activity: "coiffure" });
    expect(coiffure.checklist[1].title).toMatch(/diplôme/);
  });
});
