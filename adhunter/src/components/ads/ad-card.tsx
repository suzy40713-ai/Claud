import Link from "next/link";
import { ExternalLink, Sparkles } from "lucide-react";

import { AddToCollection, FavoriteButton, type CollectionOption } from "@/components/ads/ad-actions";
import { FORMAT_LABELS, SOURCE_LABELS } from "@/components/ads/ad-labels";
import { AdMedia } from "@/components/ads/ad-media";
import { DemoBadge } from "@/components/app/ui-bits";
import { nicheLabel } from "@/lib/ads/catalog";
import { formatDate, truncate } from "@/lib/utils";
import type { Ad } from "@/types/database";

export function AdCard({ ad, saved, collections }: { ad: Ad; saved: boolean; collections: CollectionOption[] }) {
  return (
    <article className="surface group flex flex-col overflow-hidden transition-all hover:border-primary/40">
      <Link href={`/app/ads/${ad.id}`} className="block p-3 pb-0" aria-label={`Voir la publicité de ${ad.advertiser ?? "cet annonceur"}`}>
        <AdMedia ad={ad} />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium" title={ad.advertiser ?? undefined}>{ad.advertiser ?? "Annonceur inconnu"}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            {ad.is_demo && <DemoBadge />}
            {!ad.is_demo && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">{SOURCE_LABELS[ad.source]}</span>}
          </div>
        </div>
        {ad.title && <p className="mt-2 line-clamp-1 text-sm font-medium">{ad.title}</p>}
        <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-muted-foreground">
          {truncate(ad.body, 220) || <span className="italic">Texte non fourni par la source.</span>}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded border border-border px-1.5 py-0.5">{nicheLabel(ad.niche)}</span>
          <span className="rounded border border-border px-1.5 py-0.5">{FORMAT_LABELS[ad.media_type]}</span>
          {ad.start_date && <span className="rounded border border-border px-1.5 py-0.5">Depuis le {formatDate(ad.start_date)}</span>}
          {ad.is_active && <span className="rounded border border-success/40 px-1.5 py-0.5 text-success">Active</span>}
        </div>
        <div className="mt-4 flex items-center gap-1.5">
          <Link href={`/app/ads/${ad.id}#analyse`} className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary/15 px-3 text-xs font-medium text-violet-400 transition-colors hover:bg-primary/25">
            <Sparkles className="h-3.5 w-3.5" /> Analyser
          </Link>
          <FavoriteButton adId={ad.id} initialSaved={saved} compact />
          <AddToCollection adId={ad.id} collections={collections} compact />
          {ad.source_url && (
            <a href={ad.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input text-muted-foreground hover:text-foreground" aria-label="Voir la source originale (nouvel onglet)">
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function AdGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Chargement des publicités">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface space-y-3 p-3">
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}
