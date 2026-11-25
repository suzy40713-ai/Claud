import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db, sql as pg } from "@/db/client";
import { blogPost } from "@/db/schema";
import type { AiProvider } from "@/server/ai/engine";
import { getBlogPost, listBlogPosts, runBlogAgent } from "@/server/blog/agent";
import { BLOG_TOPICS } from "@/domain/blog/topics";
import { sampleArticle } from "../fixtures/blog";

afterAll(() => pg.end());
beforeEach(async () => {
  await db.delete(blogPost);
});

let seq = 0;
function groq(): AiProvider {
  return {
    id: `groq-blog-${Date.now()}-${seq++}` as AiProvider["id"],
    label: "groq",
    url: "https://groq.example/v1/chat/completions",
    key: "cle-de-test",
    model: "openai/gpt-oss-120b",
    cap: 100,
    jsonMode: true,
  };
}
function fetchReturning(content: string) {
  let calls = 0;
  const impl = (async () => {
    calls++;
    return new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: "stop" }] }));
  }) as unknown as typeof fetch;
  return { impl, calls: () => calls };
}

describe("agent SEO", () => {
  it("publie un article de l'IA, puis attend avant le suivant", async () => {
    const now = new Date("2026-11-25T08:00:00Z");
    const f = fetchReturning(JSON.stringify(sampleArticle()));
    const r = await runBlogAgent({ now, deps: { providers: [groq()], fetch: f.impl } });
    expect(r).toMatchObject({ status: "publie", keyword: BLOG_TOPICS[0].keyword });
    const slug = r.status === "publie" ? r.slug : "";
    expect(slug).toBe("quoi-vendre-quand-on-debute-la-methode-simple-en-4-etapes");
    const post = await getBlogPost(slug);
    expect(post?.article.sections.length).toBe(5);
    expect(post?.model).toContain("groq");

    // Une heure plus tard : trop tôt, aucun appel à l'IA.
    const r2 = await runBlogAgent({
      now: new Date("2026-11-25T09:00:00Z"),
      deps: { providers: [groq()], fetch: f.impl },
    });
    expect(r2).toMatchObject({ status: "attente" });
    expect(f.calls()).toBe(1);

    // Plus tard : sujet suivant, adresse différente même si le titre est identique.
    const r3 = await runBlogAgent({
      now: new Date("2026-11-25T16:00:00Z"),
      deps: { providers: [groq()], fetch: f.impl },
    });
    expect(r3).toMatchObject({ status: "publie", keyword: BLOG_TOPICS[1].keyword });
    expect(r3.status === "publie" && r3.slug).toBe(`${slug}-2`);
    expect((await listBlogPosts()).map((p) => p.slug)[0]).toBe(`${slug}-2`);
  });

  it("ne publie rien si l'article contient une promesse ou si l'IA ne répond pas", async () => {
    const now = new Date("2026-11-26T08:00:00Z");
    const bad = fetchReturning(JSON.stringify(sampleArticle({ takeaway: "Gagnez 3 000 € par mois." })));
    const r = await runBlogAgent({ now, deps: { providers: [groq()], fetch: bad.impl } });
    expect(r.status).toBe("ia-indisponible");
    expect(await listBlogPosts()).toHaveLength(0);
    const r2 = await runBlogAgent({ now, deps: { providers: [], fetch: bad.impl } });
    expect(r2.status).toBe("ia-indisponible");
    expect(await getBlogPost("../etc")).toBeNull();
  });
});
