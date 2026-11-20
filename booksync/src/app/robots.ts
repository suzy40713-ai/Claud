import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Pages publiques indexables ; espaces privés et liens personnels exclus. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/tableau-de-bord",
        "/mon-espace",
        "/onboarding",
        "/invitation",
        "/rdv/",
        "/avis/",
        "/liste-attente/",
        "/connexion",
        "/mot-de-passe-oublie",
        "/reinitialiser-mot-de-passe",
        "/verifier-email",
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
