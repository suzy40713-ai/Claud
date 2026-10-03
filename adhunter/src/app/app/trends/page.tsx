import Link from "next/link";
import { BarChart3, Lightbulb } from "lucide-react";

import { HorizontalBars, WeeklyChart } from "@/components/app/trend-charts";
import { EmptyState, NotConfigured, PageHeader, UpgradeGate } from "@/components/app/ui-bits";
import { InfoTip } from "@/components/shared/info-tip";
import { assertFlag, requireAccount } from "@/lib/account";
import { FORMAT_LABELS, PLATFORM_LABELS } from "@/components/ads/ad-labels";
import { UserFacingError } from "@/lib/errors";
import { hasFeature } from "@/lib/plans";
import { MIN_SAMPLE, computeTrends } from "@/lib/trends";
import { cn } from "@/lib/utils";

export const metadata = { title: "Trend Radar" };

const PERIODS = [7, 30, 90];

function Card({ title, tip, children, className }: { title: string; tip?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("surface p-5", className)}>
      <h2 className="flex items-center gap-1.5 text-sm font-semibold">{title}{tip && <InfoTip>{tip}</InfoTip>}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DataTable({ rows, cols }: { rows: (string | number)[][]; cols: string[] }) {
  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Voir les données en tableau</summary>
      <table className="mt-2 w-full text-xs">
        <thead><tr>{cols.map((c) => <th key={c} className="py-1 text-left font-medium text-muted-foreground">{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((v, j) => <td key={j} className="py-1">{v}</td>)}</tr>)}</tbody>
      </table>
    </details>
  );
}

export default async function TrendsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const account = await requireAccount("/app/trends");
  if (!hasFeature(account.plan.features, "trend_radar")) {
    return (
      <div className="space-y-6">
        <PageHeader title="Trend Radar" description="Repère les niches, mots-clés et formats qui reviennent dans les données collectées." />
        <UpgradeGate feature="Trend Radar" plan="Pro" description="Suis l'évolution des niches les plus recherchées, des mots-clés et des formats publicitaires observés, semaine après semaine." />
      </div>
    );
  }
  try {
    await assertFlag("trend_radar", "Le Trend Radar");
  } catch (e) {
    return <NotConfigured title="Trend Radar indisponible">{(e as UserFacingError).message}</NotConfigured>;
  }

  const days = PERIODS.includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const t = await computeTrends(days);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trend Radar"
        description="Ce qui revient dans les données réellement collectées par AdHunter : recherches anonymisées des utilisateurs et publicités observées via les sources officielles."
        actions={
          <div className="flex rounded-lg border border-border p-0.5" role="group" aria-label="Période">
            {PERIODS.map((p) => (
              <Link key={p} href={`/app/trends?days=${p}`} aria-current={p === days ? "true" : undefined} className={cn("rounded-md px-3 py-1.5 text-xs", p === days ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {p} jours
              </Link>
            ))}
          </div>
        }
      />
      <p className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        Échantillon : <span className="text-foreground">{t.sample.searches} recherche(s)</span> et <span className="text-foreground">{t.sample.ads} publicité(s)</span> sur {t.periodDays} jours
        {t.includesDemo && " (inclut des données de démonstration)"}. Ces comptages reflètent l'activité observée dans AdHunter — ils n'indiquent ni la rentabilité ni la viralité d'une tendance.
      </p>

      {!t.sufficient ? (
        <EmptyState
          icon={BarChart3}
          title="Données insuffisantes pour dégager des tendances"
          description={`Il faut au moins ${MIN_SAMPLE} recherches ou publicités observées sur la période. Élargis la période ou lance des recherches dans l'Ad Library : chaque recherche enrichit le radar.`}
        />
      ) : (
        <>
          <Card title="Évolution hebdomadaire" tip="Nombre de recherches effectuées et de nouvelles publicités observées, par semaine.">
            <WeeklyChart data={t.weekly} />
            <DataTable cols={["Semaine", "Recherches", "Publicités"]} rows={t.weekly.map((w) => [w.week, w.searches, w.ads])} />
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Niches les plus présentes" tip="Classement par recherches + publicités observées dans la niche (classification automatique du texte).">
              {t.topNiches.length ? (
                <>
                  <HorizontalBars label="Recherches" data={t.topNiches.map((n) => ({ name: n.label, value: n.searches }))} />
                  <DataTable cols={["Niche", "Recherches", "Publicités"]} rows={t.topNiches.map((n) => [n.label, n.searches, n.ads])} />
                </>
              ) : <p className="text-sm text-muted-foreground">Aucune niche identifiée sur la période.</p>}
            </Card>
            <Card title="Formats publicitaires observés" tip="Formats des publicités observées lorsque la source les communique.">
              {t.formats.length ? (
                <HorizontalBars label="Publicités" data={t.formats.map((f) => ({ name: FORMAT_LABELS[f.key] ?? f.key, value: f.count }))} />
              ) : <p className="text-sm text-muted-foreground">Les sources n'ont pas communiqué de format sur la période.</p>}
              {t.platforms.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Plateformes : {t.platforms.map((p) => `${PLATFORM_LABELS[p.key] ?? p.key} (${p.count})`).join(" · ")}
                </p>
              )}
            </Card>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Mots-clés les plus recherchés">
              <KeywordList items={t.searchKeywords} empty="Pas encore assez de recherches par mot-clé." />
            </Card>
            <Card title="Mots-clés fréquents dans les publicités">
              <KeywordList items={t.adKeywords} empty="Pas encore assez de textes publicitaires." />
            </Card>
          </div>
          {t.ideas.length > 0 && (
            <Card title="Pistes de campagnes à explorer" tip="Suggestions générées à partir des comptages ci-dessus. Ce sont des pistes de test, pas des garanties de résultat.">
              <div className="grid gap-3 md:grid-cols-3">
                {t.ideas.map((i) => (
                  <article key={i.title} className="rounded-lg border border-border bg-background/40 p-4">
                    <Lightbulb className="h-4 w-4 text-violet-400" />
                    <h3 className="mt-2 text-sm font-medium">{i.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{i.description}</p>
                    <p className="mt-2 font-mono text-[10px] text-muted-foreground">Basé sur : {i.basedOn}</p>
                  </article>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function KeywordList({ items, empty }: { items: { key: string; count: number }[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = items[0].count;
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((k) => (
        <li key={k.key}>
          <Link href={`/app/library?q=${encodeURIComponent(k.key)}`} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs hover:border-primary/50" style={{ opacity: 0.55 + 0.45 * (k.count / max) }}>
            {k.key} <span className="font-mono text-muted-foreground">{k.count}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
