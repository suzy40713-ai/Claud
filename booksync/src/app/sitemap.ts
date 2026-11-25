import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { site } from "@/lib/site";
import { listBlogPosts } from "@/server/blog/agent";

/** Plan du site pour Google : pages publiques uniquement (dont les articles du blog). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = site.url;
  const posts = await listBlogPosts(1000).catch(() => []);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/lancer-mon-activite`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.8 },
    ...posts.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/inscription`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/conditions-generales`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
