import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Plan du site pour Google : pages publiques uniquement. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/lancer-mon-activite`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/inscription`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/conditions-generales`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
