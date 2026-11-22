import { describe, expect, it } from "vitest";
import { findIdea, TALENTS } from "@/domain/launch/ideas";
import { LAUNCH_ACTIVITIES, PLACE_LABELS } from "@/domain/launch/plan";

describe("idées pour débutants", () => {
  const ideas = TALENTS.flatMap((t) => t.ideas);

  it("chaque idée mène à un métier et un lieu de l'outil", () => {
    for (const idea of ideas) {
      expect(LAUNCH_ACTIVITIES as readonly string[]).toContain(idea.activity);
      expect(Object.keys(PLACE_LABELS)).toContain(idea.place);
    }
  });

  it("prix de départ en euros ronds, durées réalistes, au moins un service", () => {
    for (const idea of ideas) {
      expect(idea.services.length).toBeGreaterThan(0);
      for (const s of idea.services) {
        expect(s.priceCents % 100).toBe(0);
        expect(s.priceCents).toBeLessThanOrEqual(10_000);
        expect(s.durationMinutes).toBeGreaterThanOrEqual(15);
      }
    }
  });

  it("identifiants uniques, retrouvables", () => {
    expect(new Set(ideas.map((i) => i.id)).size).toBe(ideas.length);
    expect(findIdea("seniors")?.title).toBe("Aide numérique pour les seniors");
    expect(findIdea("inconnue")).toBeNull();
  });

  it("aucune idée réglementée par un diplôme (sport, coiffure, esthétique)", () => {
    for (const idea of ideas)
      expect(["coiffure", "esthetique", "barbier", "massage"]).not.toContain(idea.activity);
  });
});
