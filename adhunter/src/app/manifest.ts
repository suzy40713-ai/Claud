import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AdHunter",
    short_name: "AdHunter",
    description: "Analyse les publicités de ton marché et crée des campagnes plus intelligentes.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0B0D12",
    theme_color: "#0B0D12",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
