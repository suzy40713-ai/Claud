import { Film, Image as ImageIcon, Layers, Type } from "lucide-react";

import type { Ad } from "@/types/database";

const ICONS = { video: Film, image: ImageIcon, carousel: Layers, text: Type, unknown: Type };

/**
 * Shows the media only when the official source provides a URL (TikTok API).
 * Meta's Ad Library API does not expose media files: we show a neutral
 * placeholder and link to the official preview instead.
 */
export function AdMedia({ ad, interactive = false }: { ad: Ad; interactive?: boolean }) {
  const Icon = ICONS[ad.media_type] ?? Type;
  if (interactive && ad.media_type === "video" && ad.media_urls[0]) {
    return (
      <video controls preload="none" poster={ad.thumbnail_url ?? undefined} className="aspect-[9/16] max-h-[520px] w-full rounded-lg bg-black object-contain">
        <source src={ad.media_urls[0]} />
      </video>
    );
  }
  if (ad.thumbnail_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote URLs from official APIs with unknown hosts
      <img src={ad.thumbnail_url} alt={`Visuel de la publicité ${ad.advertiser ?? ""}`} loading="lazy" referrerPolicy="no-referrer" className="aspect-[4/3] w-full rounded-lg object-cover" />
    );
  }
  const hue = [...(ad.advertiser ?? ad.id)].reduce((h, c) => (h + c.charCodeAt(0)) % 60, 0);
  return (
    <div
      className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg text-muted-foreground"
      style={{ background: `linear-gradient(${135 + hue}deg, rgba(118,87,255,0.22) 0%, rgba(23,26,33,1) 75%)` }}
    >
      <Icon className="h-6 w-6" />
      <span className="px-4 text-center text-[11px]">
        {ad.source === "meta" ? "Visuel consultable sur la Meta Ad Library" : ad.source === "demo" ? "Visuel non disponible (démo)" : "Visuel non fourni par la source"}
      </span>
    </div>
  );
}
