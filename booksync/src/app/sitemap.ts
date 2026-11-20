import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { organization } from "@/db/schema";
import { site } from "@/lib/site";
import { publicDirectoryFilter } from "@/server/directory";

/**
 * Plan du site pour Google : pages publiques + pages des établissements qui ont choisi
 * d'apparaître dans l'annuaire (jamais les autres, jamais les activités de santé).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = site.url;
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/professionnels`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/inscription`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/pack-visibilite`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/conditions-generales`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];
  let salons: MetadataRoute.Sitemap = [];
  try {
    const rows = await db
      .select({ slug: organization.slug, createdAt: organization.createdAt })
      .from(organization)
      .where(publicDirectoryFilter())
      .orderBy(desc(organization.createdAt))
      .limit(5000);
    salons = rows.map((r) => ({
      url: `${base}/${r.slug}`,
      lastModified: r.createdAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[sitemap] établissements indisponibles", error);
  }
  return [...staticPages, ...salons];
}
