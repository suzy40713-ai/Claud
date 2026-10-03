import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { AddToCollection, FavoriteButton } from "@/components/ads/ad-actions";
import { FORMAT_LABELS, PLATFORM_LABELS, SOURCE_LABELS } from "@/components/ads/ad-labels";
import { AdMedia } from "@/components/ads/ad-media";
import { NoteEditor } from "@/components/ads/note-editor";
import { AnalyzePanel } from "@/components/ai/analyze-panel";
import { DemoBadge } from "@/components/app/ui-bits";
import { getUsage, requireAccount } from "@/lib/account";
import { countryLabel, nicheLabel } from "@/lib/ads/catalog";
import type { AdAnalysis } from "@/lib/ai/schemas";
import { getAdContext } from "@/lib/data";
import { integrations, isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Publicité" };

export default async function AdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await requireAccount(`/app/ads/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: ad } = await supabase.from("ads").select("*").eq("id", id).maybeSingle();
  if (!ad) notFound();

  const [{ savedIds, collections }, { data: favorite }, { data: lastAnalysis }, usage] = await Promise.all([
    getAdContext(account, [ad.id]),
    supabase.from("saved_ads").select("note").eq("ad_id", ad.id).eq("user_id", account.user.id).maybeSingle(),
    supabase.from("ai_analyses").select("result, is_demo").eq("ad_id", ad.id).eq("user_id", account.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    getUsage(account),
    supabase.from("ad_views").upsert({ user_id: account.user.id, ad_id: ad.id, viewed_at: new Date().toISOString() }),
  ]);

  const limit = usage.limits.analysis;
  const remaining = limit < 0 ? null : Math.max(0, limit - usage.counts.analysis);

  const meta: [string, React.ReactNode][] = [
    ["Source", SOURCE_LABELS[ad.source]],
    ["Annonceur", ad.advertiser ?? "Inconnu"],
    ["Plateformes", ad.platforms.map((p) => PLATFORM_LABELS[p] ?? p).join(", ") || "—"],
    ["Format", FORMAT_LABELS[ad.media_type]],
    ["Niche estimée", nicheLabel(ad.niche)],
    ["Pays", ad.countries.map(countryLabel).join(", ") || "—"],
    ["Langues", ad.languages.join(", ").toUpperCase() || "—"],
    ["Début de diffusion", ad.start_date ? formatDate(ad.start_date) : "Non communiqué"],
    ["Fin de diffusion", ad.end_date ? formatDate(ad.end_date) : ad.is_active ? "En cours" : "Non communiquée"],
  ];

  return (
    <div className="space-y-8">
      <Link href="/app/library" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Retour à l'Ad Library
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="surface space-y-4 p-4">
          <AdMedia ad={ad} interactive />
          <div className="flex flex-wrap gap-2">
            <FavoriteButton adId={ad.id} initialSaved={savedIds.has(ad.id)} />
            <AddToCollection adId={ad.id} collections={collections} />
            {ad.source_url && (
              <a href={ad.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-md border border-input px-3 text-sm text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-4 w-4" /> Source originale
              </a>
            )}
          </div>
          {favorite && <NoteEditor adId={ad.id} initialNote={favorite.note} />}
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{ad.advertiser ?? "Publicité"}</h1>
            {ad.is_demo && <DemoBadge />}
          </div>
          {ad.title && <p className="text-lg font-medium">{ad.title}</p>}
          <div className="surface p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Texte publicitaire</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{ad.body ?? <span className="italic text-muted-foreground">Texte non fourni par la source. Consulte la source originale.</span>}</p>
            {ad.description && <p className="mt-3 text-sm text-muted-foreground">{ad.description}</p>}
            {ad.cta && <p className="mt-3 text-xs text-muted-foreground">Légende / lien : {ad.cta}</p>}
          </div>
          <dl className="surface grid grid-cols-1 gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-2">
            {meta.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-border/60 pb-2 sm:block sm:border-0 sm:pb-0">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-right sm:mt-0.5 sm:text-left">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            Budget, ventes et taux de conversion ne sont pas publiés par les bibliothèques officielles : ils ne sont donc pas affichés.
          </p>
        </div>
      </div>
      <section id="analyse" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-semibold">Analyse IA</h2>
        <AnalyzePanel
          adId={ad.id}
          initial={lastAnalysis ? { result: lastAnalysis.result as AdAnalysis, isDemo: lastAnalysis.is_demo } : null}
          remaining={remaining}
          available={integrations.ai() || isDemoMode()}
        />
      </section>
    </div>
  );
}
