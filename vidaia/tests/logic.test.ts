import { describe, expect, it } from "vitest";
import { findPack, formatEuros, PACKS, perVideo } from "@/lib/packs";
import { checkScript, requestSchema, sceneStarts, videoDuration, voiceSegments, voiceText, type VideoScript } from "@/lib/script";
import { createToken, verifyToken } from "@/lib/tokens";

const script: VideoScript = {
  hook: "3 idées de cadeaux faits main 🎁",
  hookVoice: "Tu cherches un cadeau qui fait vraiment plaisir ?",
  points: [
    { title: "Une bougie parfumée", detail: "Coulée à la main, cire végétale", voice: "Une bougie parfumée, coulée à la main avec de la cire végétale." },
    { title: "Un carnet personnalisé", detail: "Avec le prénom sur la couverture", voice: "Un carnet personnalisé, avec le prénom gravé sur la couverture." },
    { title: "Un savon artisanal", detail: "Doux pour la peau", voice: "Un savon artisanal, doux pour la peau et joliment emballé." },
  ],
  closing: "Offre un cadeau qui a une histoire",
  closingVoice: "Offre un cadeau qui a une histoire. Le lien est dans ma bio.",
  cta: "Lien en bio 👆",
};

describe("packs", () => {
  it("5 / 15 / 40 vidéos à 9,99 / 24,99 / 49,99 €", () => {
    expect(PACKS.map((p) => [p.videos, p.priceCents])).toEqual([[5, 999], [15, 2499], [40, 4999]]);
    expect(findPack("createur")?.videos).toBe(15);
    expect(findPack("inconnu")).toBeNull();
    expect(formatEuros(999)).toMatch(/9,99\s?€/);
    expect(perVideo(PACKS[2])).toBe(125);
  });
});

describe("script", () => {
  it("accepte un script complet et refuse les dérives", () => {
    expect(checkScript(script)).toBeNull();
    expect(checkScript({ ...script, points: script.points.slice(0, 2) })).toMatch(/3 points/);
    expect(checkScript({ ...script, closingVoice: "Résultat garanti dès demain." })).toMatch(/promesse/);
    expect(checkScript({ ...script, hookVoice: "", points: script.points.map((p) => ({ ...p, voice: "Oui." })), closingVoice: "Fin." })).toMatch(/longueur/);
  });

  it("valide la demande du client", () => {
    expect(requestSchema.safeParse({ description: "trop court" }).success).toBe(false);
    const ok = requestSchema.parse({ description: "Je vends des bougies parfumées faites main." });
    expect(ok).toMatchObject({ tone: "dynamique", theme: "bleu", cta: "" });
  });

  it("minute les scènes à partir de l'alignement de la voix", () => {
    const text = voiceText(script);
    const chars = [...text];
    // Alignement synthétique : 0,05 s par caractère.
    const a = {
      characters: chars,
      character_start_times_seconds: chars.map((_, i) => i * 0.05),
      character_end_times_seconds: chars.map((_, i) => i * 0.05 + 0.05),
    };
    const { starts, voiceEnd } = sceneStarts(script, a);
    const segs = voiceSegments(script);
    expect(starts).toHaveLength(5);
    expect(starts[0]).toBe(0);
    expect(starts[1]).toBeCloseTo((segs[0].length + 1) * 0.05, 5);
    for (let i = 1; i < 5; i++) expect(starts[i]).toBeGreaterThan(starts[i - 1]);
    expect(voiceEnd).toBeCloseTo(text.length * 0.05, 5);
    expect(videoDuration(voiceEnd)).toBeGreaterThan(voiceEnd + 1.5);
  });
});

describe("jetons signés", () => {
  const secret = "s".repeat(40);
  const id = "0b0b9c3e-1111-4222-8333-444455556666";
  it("valide un jeton, refuse modifié, expiré ou d'un autre usage", () => {
    const t = createToken(secret, "session", id, 60);
    expect(verifyToken(secret, "session", t)).toBe(id);
    expect(verifyToken(secret, "lien", t)).toBeNull();
    expect(verifyToken("x".repeat(40), "session", t)).toBeNull();
    expect(verifyToken(secret, "session", t.replace(/.$/, (c) => (c === "A" ? "B" : "A")))).toBeNull();
    expect(verifyToken(secret, "session", createToken(secret, "session", id, 60, Date.now() - 120_000))).toBeNull();
    expect(verifyToken(secret, "session", "n'importe.quoi.ici")).toBeNull();
    expect(verifyToken(secret, "session", undefined)).toBeNull();
  });
});
