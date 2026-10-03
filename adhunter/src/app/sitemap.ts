import type { MetadataRoute } from "next";

import { POSTS } from "@/content/blog";
import { LEGAL_PAGES } from "@/content/legal";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/fonctionnalites`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/tarifs`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...POSTS.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: new Date(p.date), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${base}/signup`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    ...LEGAL_PAGES.map((p) => ({ url: `${base}/legal/${p.slug}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
