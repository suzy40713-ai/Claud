import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { localDateOf } from "@/domain/availability/engine";
import { byChannel, channelLabel, ratios, totals } from "@/domain/marketing/results";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requirePermission } from "@/server/auth/session";
import { listProducts } from "@/server/marketing/products";
import { copilotActivity, listResults } from "@/server/marketing/results";
import { DeleteResultButton, ResultForm } from "./result-form";

export const metadata: Metadata = { title: "Statistiques marketing" };

const PERIODS = [7, 30, 90] as const;
const nb = (n: number | null) => (n === null ? "—" : n.toLocaleString("fr-FR"));
const eur = (c: number | null) => (c === null ? "—" : formatCents(c));
const pct = (n: number | null) => (n === null ? "—" : `${n.toLocaleString("fr-FR")} %`);

async function Content({ searchParams }: { searchParams: Promise<{ jours?: string }> }) {
  const ctx = await requirePermission("marketing.manage");
  const { jours } = await searchParams;
  const days = PERIODS.find((p) => String(p) === jours) ?? 30;
  const [rows, products, activity] = await Promise.all([
    listResults(ctx, days),
    listProducts(ctx),
    copilotActivity(ctx),
  ]);
  const names = new Map(products.map((p) => [p.id, p.name]));
  const t = totals(rows);
  const r = ratios(t);
  const today = localDateOf(new Date(), ctx.organization.timezone);
  return (
    <div className="grid gap-6">
      <nav className="flex gap-2" aria-label="Période">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={`/tableau-de-bord/resultats?jours=${p}` as Route}
            aria-current={p === days ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              p === days && "border-primary bg-primary-soft text-primary-soft-foreground",
            )}
          >
            {p} jours
          </Link>
        ))}
      </nav>

      <section className="grid gap-3" data-testid="results-summary">
        <h2 className="text-lg font-semibold">Vos chiffres déclarés</h2>
        {rows.length === 0 ? (
          <Alert>
            Aucun résultat saisi sur cette période. BookSync n&apos;est connecté à aucune
            plateforme publicitaire : notez ici ce que vous lisez dans TikTok, Instagram, votre
            boutique… Les indicateurs sont calculés uniquement à partir de ces chiffres.
          </Alert>
        ) : null}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Dépense" value={formatCents(t.spendCents)} hint={`${t.entries} saisie(s)`} />
          <StatCard label="Ventes" value={nb(t.sales)} hint={`Chiffre d'affaires : ${eur(t.revenueCents)}`} />
          <StatCard
            label="Coût par vente"
            value={eur(r.costPerSaleCents)}
            hint={r.costPerSaleCents === null ? "Il faut une dépense et des ventes" : "Dépense ÷ ventes"}
          />
          <StatCard
            label="Retour sur dépense"
            value={r.roas === null ? "—" : `× ${r.roas.toLocaleString("fr-FR")}`}
            hint={r.roas === null ? "Il faut une dépense et un chiffre d'affaires" : "Chiffre d'affaires ÷ dépense"}
          />
          <StatCard label="Vues" value={nb(t.impressions)} />
          <StatCard label="Clics" value={nb(t.clicks)} hint={`Taux de clic : ${pct(r.clickRate)}`} />
          <StatCard label="Conversion" value={pct(r.conversionRate)} hint="Ventes ÷ clics" />
        </div>
      </section>

      {rows.length ? (
        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">Par canal</h2>
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[560px] text-sm" data-testid="results-by-channel">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Canal</th>
                  <th className="p-3 font-medium">Dépense</th>
                  <th className="p-3 font-medium">Clics</th>
                  <th className="p-3 font-medium">Ventes</th>
                  <th className="p-3 font-medium">Chiffre d&apos;affaires</th>
                  <th className="p-3 font-medium">Coût par vente</th>
                </tr>
              </thead>
              <tbody>
                {byChannel(rows).map((c) => (
                  <tr key={c.channel} className="border-t">
                    <td className="p-3 font-medium">{channelLabel(c.channel)}</td>
                    <td className="p-3">{formatCents(c.totals.spendCents)}</td>
                    <td className="p-3">{nb(c.totals.clicks)}</td>
                    <td className="p-3">{nb(c.totals.sales)}</td>
                    <td className="p-3">{eur(c.totals.revenueCents)}</td>
                    <td className="p-3">{eur(ratios(c.totals).costPerSaleCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Ajouter un résultat</h2>
        <ResultForm today={today} products={products.map((p) => ({ id: p.id, name: p.name }))} />
      </section>

      {rows.length ? (
        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">Saisies</h2>
          <ul className="grid gap-2" data-testid="results-list">
            {rows.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {new Date(`${row.date}T12:00:00Z`).toLocaleDateString("fr-FR")} · {channelLabel(row.channel)}
                    {row.productId ? ` · ${names.get(row.productId) ?? ""}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {formatCents(row.spendCents)} dépensés
                    {row.clicks !== null ? ` · ${nb(row.clicks)} clics` : ""}
                    {row.sales !== null ? ` · ${nb(row.sales)} ventes` : ""}
                    {row.revenueCents !== null ? ` · ${formatCents(row.revenueCents)}` : ""}
                    {row.note ? ` · ${row.note}` : ""}
                  </p>
                </div>
                <DeleteResultButton id={row.id} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Votre activité sur BookSync</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="copilot-activity">
          <StatCard label="Produits" value={String(products.length)} />
          <StatCard label="Propositions préparées" value={String(activity.generations)} hint="Analyses, stratégies, publicités, contenus" />
          <StatCard label="Actions Autopilot faites" value={String(activity.tasksDone)} hint="Depuis le début" />
        </div>
      </section>
    </div>
  );
}

export default function ResultsPage(props: PageProps<"/tableau-de-bord/resultats">) {
  return (
    <>
      <PageHeader
        title="Statistiques marketing"
        description="Vos dépenses et vos ventes, saisies par vous. Aucun chiffre estimé ou inventé."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={props.searchParams as Promise<{ jours?: string }>} />
      </Suspense>
    </>
  );
}
