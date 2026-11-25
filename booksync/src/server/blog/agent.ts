import "server-only";
import { count, desc, eq, gte, like, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { blogPost } from "@/db/schema";
import {
  BLOG_SYSTEM,
  blogArticleSchema,
  blogPrompt,
  checkArticle,
  nextTopic,
  publishDecision,
  slugify,
  type BlogArticle,
} from "@/domain/blog/article";
import type { BlogTopic } from "@/domain/blog/topics";
import { aiJson, isAiAvailable, providerModel, type AiDeps } from "@/server/ai/engine";

/**
 * Agent SEO : publie au plus POSTS_PER_DAY articles par jour, espacés, écrits par l'IA gratuite
 * (Groq, puis Cloudflare). Sans IA disponible, rien n'est publié : jamais d'article de remplissage.
 */
export type BlogAgentResult =
  | { status: "publie"; slug: string; keyword: string }
  | { status: "attente"; reason: string }
  | { status: "ia-indisponible" }
  | { status: "refuse"; reason: string };

const topicSchema = z.object({
  keyword: z.string().describe("Recherche Google visée, en minuscules, 3 à 8 mots."),
  angle: z.string().describe("Angle concret de l'article, une phrase."),
});

/** Quand la liste de sujets est épuisée, l'IA propose un nouveau sujet jamais traité. */
async function inventTopic(used: string[], deps?: AiDeps): Promise<BlogTopic | null> {
  const r = await aiJson(
    {
      system:
        "Tu proposes des sujets d'articles de blog pour des débutants français qui veulent trouver quoi vendre, lancer un petit business et faire leurs premières ventes (marketing, réseaux sociaux, prix, clients).",
      user: `Propose UN nouveau sujet, différent de tous ceux-ci :\n${used.map((k) => `- ${k}`).join("\n")}`,
      schema: topicSchema,
      maxTokens: 400,
      check: (t) => (used.includes(t.keyword.trim().toLowerCase()) ? "sujet déjà traité" : null),
    },
    deps,
  );
  return r ? { keyword: r.output.keyword.trim().toLowerCase(), angle: r.output.angle } : null;
}

async function uniqueSlug(title: string) {
  const base = slugify(title) || "article";
  const rows = await db
    .select({ slug: blogPost.slug })
    .from(blogPost)
    .where(or(eq(blogPost.slug, base), like(blogPost.slug, `${base}-%`)));
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function runBlogAgent(opts: { now?: Date; deps?: AiDeps } = {}): Promise<BlogAgentResult> {
  const now = opts.now ?? new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [[today], [last]] = await Promise.all([
    db.select({ n: count() }).from(blogPost).where(gte(blogPost.publishedAt, dayStart)),
    db.select({ at: blogPost.publishedAt }).from(blogPost).orderBy(desc(blogPost.publishedAt)).limit(1),
  ]);
  const decision = publishDecision({
    publishedToday: today?.n ?? 0,
    lastPublishedAt: last?.at ?? null,
    now,
  });
  if (!decision.ok) return { status: "attente", reason: decision.reason };
  if (!opts.deps?.providers && !isAiAvailable()) return { status: "ia-indisponible" };

  const used = (await db.select({ k: blogPost.keyword }).from(blogPost)).map((r) => r.k);
  const topic = nextTopic(used) ?? (await inventTopic(used, opts.deps));
  if (!topic) return { status: "ia-indisponible" };

  const r = await aiJson(
    {
      system: BLOG_SYSTEM,
      user: blogPrompt(topic),
      schema: blogArticleSchema,
      maxTokens: 6000,
      check: checkArticle,
    },
    opts.deps,
  );
  if (!r) return { status: "ia-indisponible" };
  const article: BlogArticle = r.output;
  const problem = checkArticle(article);
  if (problem) return { status: "refuse", reason: problem };

  const slug = await uniqueSlug(article.title);
  await db.insert(blogPost).values({
    slug,
    keyword: topic.keyword,
    title: article.title.trim(),
    description: article.metaDescription.trim(),
    content: article,
    model: providerModel(r.provider),
    publishedAt: now,
  });
  console.info("[blog] article publié", slug);
  return { status: "publie", slug, keyword: topic.keyword };
}

/** Articles publiés, du plus récent au plus ancien. */
export async function listBlogPosts(limit = 60) {
  return db
    .select({
      slug: blogPost.slug,
      title: blogPost.title,
      description: blogPost.description,
      publishedAt: blogPost.publishedAt,
    })
    .from(blogPost)
    .orderBy(desc(blogPost.publishedAt))
    .limit(limit);
}

export async function getBlogPost(slug: string) {
  if (!/^[a-z0-9-]{1,90}$/.test(slug)) return null;
  const [row] = await db.select().from(blogPost).where(eq(blogPost.slug, slug));
  if (!row) return null;
  const parsed = blogArticleSchema.safeParse(row.content);
  if (!parsed.success) return null;
  return { ...row, article: parsed.data };
}
