import Link from "next/link";
import { Bookmark, Library, Sparkles } from "lucide-react";

import { AnalysisDisclaimer } from "@/components/ai/analysis-view";
import { DemoBadge, EmptyState, NotConfigured, PageHeader, UsageBar } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { getUsage, requireAccount } from "@/lib/account";
import type { AdAnalysis } from "@/lib/ai/schemas";
import { integrations, isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formatRelative, truncate } from "@/lib/utils";

export const metadata = { title: "AI Analyzer" };

export default async function AnalyzerPage() {
  const account = await requireAccount("/app/analyzer");
  const supabase = await createClient();
  const [usage, { data: analyses }, { data: favorites }] = await Promise.all([
    getUsage(account),
    supabase
      .from("ai_analyses")
      .select("id, result, is_demo, created_at, ad:ads(id, advertiser, title, body, source)")
      .eq("user_id", account.user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("saved_ads")
      .select("ad:ads(id, advertiser, title, body)")
      .eq("user_id", account.user.id)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  type AdLite = { id: string; advertiser: string | null; title: string | null; body: string | null };

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Analyzer"
        description="Sélectionne une publicité et obtiens une analyse claire : accroche, cible probable, techniques, forces, faiblesses, idées et recommandations."
      />
      {!integrations.ai() && !isDemoMode() && (
        <NotConfigured title="Analyse IA en préparation">
          La clé du service d'IA (ANTHROPIC_API_KEY) n'est pas encore configurée sur cette instance. Aucun résultat simulé n'est généré.
        </NotConfigured>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="surface p-5">
          <h2 className="font-medium">Comment lancer une analyse ?</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>Trouve une publicité dans l'Ad Library (ou tes favoris).</li>
            <li>Ouvre-la et clique sur « Analyser avec l'IA ».</li>
            <li>Retrouve ici l'historique de toutes tes analyses.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="brand" size="sm"><Link href="/app/library"><Library /> Ouvrir l'Ad Library</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/app/favorites"><Bookmark /> Mes favoris</Link></Button>
          </div>
        </div>
        <div className="surface space-y-3 p-5">
          <p className="text-sm font-medium">Ton quota ce mois-ci</p>
          <UsageBar label="Analyses IA" used={usage.counts.analysis} limit={usage.limits.analysis} />
          <p className="text-xs text-muted-foreground">Réinitialisé le 1er du mois.</p>
        </div>
      </div>

      {(favorites ?? []).length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Analyser un favori</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(favorites ?? []).map((f) => {
              const ad = f.ad as unknown as AdLite | null;
              if (!ad) return null;
              return (
                <Link key={ad.id} href={`/app/ads/${ad.id}#analyse`} className="surface card-hover block p-4">
                  <p className="truncate text-sm font-medium">{ad.advertiser ?? "Annonceur"}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{truncate(ad.title || ad.body, 120) || "—"}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-xs text-violet-400"><Sparkles className="h-3 w-3" /> Analyser</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Historique des analyses</h2>
        <AnalysisDisclaimer />
        {(analyses ?? []).length === 0 ? (
          <EmptyState icon={Sparkles} title="Aucune analyse pour l'instant" description="Tes analyses apparaîtront ici. Commence par ouvrir une publicité qui t'intrigue." />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {(analyses ?? []).map((a) => {
              const ad = a.ad as unknown as (AdLite & { source: string }) | null;
              const result = a.result as AdAnalysis;
              return (
                <li key={a.id}>
                  <Link href={ad ? `/app/ads/${ad.id}#analyse` : "#"} className="flex flex-col gap-1 p-4 transition-colors hover:bg-card sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-medium">{ad?.advertiser ?? "Publicité supprimée"} {a.is_demo && <DemoBadge />}</p>
                      <p className="truncate text-xs text-muted-foreground">{truncate(result.summary, 160)}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatRelative(a.created_at)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
