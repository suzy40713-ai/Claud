import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, Library, SearchX } from "lucide-react";

import { AdCard, AdGridSkeleton } from "@/components/ads/ad-card";
import { SearchFiltersForm } from "@/components/ads/search-filters";
import { EmptyState, NotConfigured, PageHeader } from "@/components/app/ui-bits";
import { InfoTip } from "@/components/shared/info-tip";
import { Button } from "@/components/ui/button";
import { requireAccount, type Account } from "@/lib/account";
import { NICHES } from "@/lib/ads/catalog";
import { getSourceStatuses, hasSearchCriteria, parseFilters, runSearch } from "@/lib/ads/search";
import type { SearchFilters } from "@/lib/ads/types";
import { getAdContext } from "@/lib/data";
import { UserFacingError, logError } from "@/lib/errors";
import { hasFeature } from "@/lib/plans";

export const metadata = { title: "Ad Library" };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const account = await requireAccount("/app/library");
  const params = await searchParams;
  const filters = parseFilters(params);
  const sources = await getSourceStatuses();
  const anyAvailable = sources.some((s) => s.available);
  const advanced = hasFeature(account.plan.features, "advanced_search");
  const key = JSON.stringify(filters);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ad Library"
        description="Recherche des publicités dans les bibliothèques publicitaires officielles. Chaque résultat renvoie vers sa source originale."
        info={<InfoTip>Les sources officielles ne publient ni budgets, ni ventes, ni taux de conversion : AdHunter ne les affiche donc jamais.</InfoTip>}
      />
      {!anyAvailable && (
        <NotConfigured title="Sources publicitaires en préparation">
          Aucune source officielle n'est encore connectée sur cette instance. Un administrateur doit configurer un jeton Meta Ad Library API
          (META_ACCESS_TOKEN) et/ou un accès TikTok Commercial Content API. Aucun résultat simulé n'est affiché en attendant.
        </NotConfigured>
      )}
      {sources.filter((s) => !s.available && s.reason).length > 0 && anyAvailable && (
        <p className="text-xs text-muted-foreground">
          {sources.filter((s) => !s.available).map((s) => `${s.label} : ${s.reason}`).join(" · ")}
        </p>
      )}
      <SearchFiltersForm filters={filters} sources={sources} advanced={advanced} />
      {hasSearchCriteria(filters) ? (
        <Suspense key={key} fallback={<AdGridSkeleton />}>
          <Results account={account} filters={filters} />
        </Suspense>
      ) : (
        <div className="space-y-4">
          <EmptyState
            icon={Library}
            title="Lance ta première recherche"
            description="Saisis un mot-clé (produit, bénéfice, marque) ou choisis une niche. Astuce : commence large, puis affine avec le pays, la langue et le format."
          />
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Explorer une niche</p>
            <div className="flex flex-wrap gap-2">
              {NICHES.map((n) => (
                <Link key={n.id} href={`/app/library?niche=${n.id}&country=${filters.country}`} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function Results({ account, filters }: { account: Account; filters: SearchFilters }) {
  let outcome;
  try {
    outcome = await runSearch(account, filters);
  } catch (error) {
    const message = error instanceof UserFacingError ? error.message : "La recherche a échoué. Réessaie dans quelques instants.";
    if (!(error instanceof UserFacingError)) await logError("library:search", error, account.user.id);
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Recherche impossible"
        description={message}
        action={error instanceof UserFacingError && error.code === "quota_exceeded" ? <Button asChild variant="brand"><Link href="/app/billing">Voir les formules</Link></Button> : undefined}
      />
    );
  }

  const { ads, nextCursor, warnings, cached } = outcome;
  const { savedIds, collections } = await getAdContext(account, ads.map((a) => a.id));
  const nextParams = new URLSearchParams(
    Object.entries({ ...filters, cursor: nextCursor ?? undefined }).filter((e): e is [string, string] => typeof e[1] === "string")
  );

  return (
    <section aria-label="Résultats" className="space-y-4">
      {warnings.map((w) => (
        <p key={w} className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {w}
        </p>
      ))}
      {ads.length === 0 ? (
        <EmptyState icon={SearchX} title="Aucune publicité trouvée" description="Essaie un mot-clé plus général, une autre langue, ou retire le filtre de format ou de date." />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {ads.length} publicité{ads.length > 1 ? "s" : ""} {cached ? "(résultats récents mis en cache)" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} saved={savedIds.has(ad.id)} collections={collections} />
            ))}
          </div>
          {nextCursor && (
            <div className="flex justify-center pt-2">
              <Button asChild variant="outline">
                <Link href={`/app/library?${nextParams.toString()}`}>Résultats suivants</Link>
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
