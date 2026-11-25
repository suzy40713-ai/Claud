import { describe, expect, it } from "vitest";
import {
  blogArticleSchema,
  checkArticle,
  MIN_GAP_HOURS,
  nextTopic,
  POSTS_PER_DAY,
  publishDecision,
  readingMinutes,
  slugify,
} from "@/domain/blog/article";
import { BLOG_TOPICS } from "@/domain/blog/topics";
import { sampleArticle } from "../fixtures/blog";

describe("agent SEO : règles du blog", () => {
  it("accepte un article complet et le schéma le valide", () => {
    const a = sampleArticle();
    expect(blogArticleSchema.safeParse(a).success).toBe(true);
    expect(checkArticle(a)).toBeNull();
    expect(readingMinutes(a)).toBeGreaterThanOrEqual(3);
  });

  it("refuse les articles trop courts ou incomplets", () => {
    expect(checkArticle(sampleArticle({ sections: sampleArticle().sections.slice(0, 2) }))).toMatch(/parties/);
    const short = sampleArticle({
      sections: sampleArticle().sections.map((s) => ({ ...s, paragraphs: ["Court."], bullets: [] })),
    });
    expect(checkArticle(short)).toMatch(/trop court/);
    expect(checkArticle(sampleArticle({ title: "Court" }))).toMatch(/titre/);
  });

  it("refuse toute promesse de revenu ou de résultat", () => {
    for (const bad of [
      "Résultat garanti dès la première semaine.",
      "Vous gagnerez 2 000 € par mois facilement.",
      "Créez des revenus passifs.",
      "De l'argent facile pour tous.",
    ]) {
      expect(checkArticle(sampleArticle({ takeaway: bad }))).toMatch(/promesse interdite/);
    }
    // Un prix de produit reste permis.
    expect(checkArticle(sampleArticle({ takeaway: "Testez un prix de départ de 19,90 € et notez les réactions." }))).toBeNull();
  });

  it("fabrique des adresses propres", () => {
    expect(slugify("Quoi vendre quand on débute : la méthode simple !")).toBe(
      "quoi-vendre-quand-on-debute-la-methode-simple",
    );
    expect(slugify("Cœur & âme — l'été")).toBe("coeur-ame-l-ete");
    expect(slugify("x".repeat(120)).length).toBeLessThanOrEqual(80);
  });

  it("prend le premier sujet jamais traité, sans doublon", () => {
    const keys = BLOG_TOPICS.map((t) => t.keyword);
    expect(new Set(keys).size).toBe(keys.length);
    expect(nextTopic([])).toEqual(BLOG_TOPICS[0]);
    expect(nextTopic([BLOG_TOPICS[0].keyword.toUpperCase()])).toEqual(BLOG_TOPICS[1]);
    expect(nextTopic(keys)).toBeNull();
  });

  it("publie au plus 3 articles par jour, espacés", () => {
    const now = new Date("2026-11-25T12:00:00Z");
    expect(POSTS_PER_DAY).toBe(3);
    expect(publishDecision({ publishedToday: 0, lastPublishedAt: null, now }).ok).toBe(true);
    expect(publishDecision({ publishedToday: 3, lastPublishedAt: null, now })).toMatchObject({ ok: false });
    const recent = new Date(now.getTime() - (MIN_GAP_HOURS - 1) * 3_600_000);
    expect(publishDecision({ publishedToday: 1, lastPublishedAt: recent, now })).toMatchObject({ ok: false });
    const old = new Date(now.getTime() - (MIN_GAP_HOURS + 0.1) * 3_600_000);
    expect(publishDecision({ publishedToday: 1, lastPublishedAt: old, now }).ok).toBe(true);
  });
});
