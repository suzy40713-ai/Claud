import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  AlertTriangle,
  CalendarClock,
  CalendarX2,
  Euro,
  Info,
  Lightbulb,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { UpgradeNotice } from "@/components/settings/section";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { DAY_NAMES, type Recommendation } from "@/domain/insights/analyze";
import { formatCents } from "@/lib/format";
import { requirePermission } from "@/server/auth/session";
import { getInsights } from "@/server/insights";

export const metadata: Metadata = { title: "Analyses" };

const TONE = {
  opportunity: { icon: Lightbulb, className: "bg-primary-soft text-primary" },
  warning: { icon: AlertTriangle, className: "bg-warning-soft text-warning" },
  info: { icon: Info, className: "bg-muted text-muted-foreground" },
} as const;

function RecommendationCard({ r }: { r: Recommendation }) {
  const t = TONE[r.tone];
  const Icon = t.icon;
  return (
    <li className="flex gap-3 rounded-xl border bg-card p-4 shadow-xs" data-testid="recommendation">
      <span
        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${t.className}`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{r.title}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{r.detail}</p>
        {r.action ? (
          <Link
            href={r.action.href as Route}
            className="mt-1.5 inline-block text-[13px] font-semibold text-primary hover:underline"
          >
            {r.action.label} →
          </Link>
        ) : null}
      </div>
    </li>
  );
}

function Heatmap({ heatmap }: { heatmap: number[][] }) {
  const hours = Array.from({ length: 24 }, (_, h) => h).filter((h) =>
    heatmap.some((row) => row[h] > 0),
  );
  if (!hours.length) return null;
  const first = Math.min(...hours);
  const last = Math.max(...hours);
  const range = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const max = Math.max(1, ...heatmap.flat());
  return (
    <div className="overflow-x-auto rounded-xl border bg-card p-4 shadow-xs">
      <table className="w-full min-w-[480px] border-separate border-spacing-1 text-[11px]">
        <thead>
          <tr>
            <th className="w-10" />
            {range.map((h) => (
              <th key={h} className="font-normal text-muted-foreground">
                {h}h
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heatmap.map((row, d) => (
            <tr key={d}>
              <th className="pr-1 text-left font-medium text-muted-foreground capitalize">
                {DAY_NAMES[d].slice(0, 3)}
              </th>
              {range.map((h) => {
                const n = row[h];
                return (
                  <td
                    key={h}
                    title={`${DAY_NAMES[d]} ${h} h : ${n} rendez-vous`}
                    className="h-7 rounded-[5px] text-center tabular-nums"
                    style={{
                      background: n
                        ? `color-mix(in oklab, var(--primary) ${Math.round(15 + (n / max) * 85)}%, transparent)`
                        : "var(--muted)",
                      color: n / max > 0.55 ? "white" : undefined,
                    }}
                  >
                    {n || ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        Rendez-vous maintenus des 90 derniers jours, par jour et par heure de début.
      </p>
    </div>
  );
}

async function Content() {
  const ctx = await requirePermission("stats.view");
  if (!ctx.plan.features.advancedStats) {
    return (
      <div className="grid gap-4">
        <UpgradeNotice feature="Le module d'analyse de votre activité" />
        <p className="text-sm text-muted-foreground">
          Horaires les plus demandés, périodes creuses, annulations, tendances, clients réguliers et
          recommandations concrètes, calculés à partir de vos vrais rendez-vous.
        </p>
      </div>
    );
  }
  const i = await getInsights(ctx);
  const change = i.trend.changePct;
  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <h2 className="text-[15px] font-semibold">Recommandations</h2>
        {i.recommendations.length ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {i.recommendations.map((r) => (
              <RecommendationCard key={r.id} r={r} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Rien à signaler : votre activité est équilibrée.
          </p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Rendez-vous (30 j)"
          value={String(i.trend.last30)}
          hint={
            change === null
              ? "pas de période de comparaison"
              : `${change >= 0 ? "+" : ""}${change} % vs 30 j précédents`
          }
          icon={change !== null && change < 0 ? <TrendingDown /> : <TrendingUp />}
        />
        <StatCard
          label="Chiffre d'affaires (30 j)"
          value={formatCents(i.trend.revenueLast30)}
          hint={`${formatCents(i.trend.revenuePrev30)} les 30 j précédents`}
          icon={<Euro />}
        />
        <StatCard
          label="Annulations (90 j)"
          value={`${i.cancellations.rate} %`}
          hint={`${i.cancellations.count} annulés, dont ${i.cancellations.late} à moins de 24 h`}
          icon={<CalendarX2 />}
        />
        <StatCard
          label="À venir (14 j)"
          value={String(i.trend.upcoming14)}
          hint="rendez-vous confirmés"
          icon={<CalendarClock />}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="grid content-start gap-3">
          <h2 className="text-[15px] font-semibold">Horaires les plus demandés</h2>
          {i.sampleSize ? (
            <Heatmap heatmap={i.heatmap} />
          ) : (
            <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              Aucun rendez-vous sur les 90 derniers jours.
            </p>
          )}
          {i.peakSlots.length || i.quietSlots.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-4 text-sm shadow-xs">
                <p className="font-semibold">Heures de pointe</p>
                <ul className="mt-2 grid gap-1 text-muted-foreground">
                  {i.peakSlots.map((s) => (
                    <li key={`${s.weekday}-${s.hour}`}>
                      <span className="capitalize">{DAY_NAMES[s.weekday - 1]}</span> {s.hour} h ·{" "}
                      {s.count} RDV
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border bg-card p-4 text-sm shadow-xs">
                <p className="font-semibold">Périodes creuses (heures d&apos;ouverture)</p>
                <ul className="mt-2 grid gap-1 text-muted-foreground">
                  {i.quietSlots.map((s) => (
                    <li key={`${s.weekday}-${s.hour}`}>
                      <span className="capitalize">{DAY_NAMES[s.weekday - 1]}</span> {s.hour} h ·{" "}
                      {s.count} RDV
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid content-start gap-3">
          <h2 className="text-[15px] font-semibold">Prestations les plus réservées</h2>
          {i.services.length ? (
            <ul className="grid gap-3 rounded-xl border bg-card p-4 shadow-xs">
              {i.services.slice(0, 6).map((s) => (
                <li key={s.name} className="grid gap-1 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="truncate font-medium">{s.name}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {s.count} · {s.share} %
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${s.share}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              Pas encore de données.
            </p>
          )}
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="grid content-start gap-3">
          <h2 className="text-[15px] font-semibold">
            Clients à relancer <span className="text-muted-foreground">({i.lapsed.length})</span>
          </h2>
          {i.lapsed.length ? (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
              {i.lapsed.slice(0, 10).map((c) => (
                <li
                  key={c.customerId}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <Link
                    href={`/tableau-de-bord/clients/${c.customerId}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.visits} visites · dernière il y a {c.daysSince} j (habituellement tous les{" "}
                    {c.avgIntervalDays} j)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              Aucun client régulier en retard sur ses habitudes.
            </p>
          )}
        </section>
        <section className="grid content-start gap-3">
          <h2 className="text-[15px] font-semibold">
            Clients réguliers <span className="text-muted-foreground">({i.regulars.length})</span>
          </h2>
          {i.regulars.length ? (
            <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
              {i.regulars.slice(0, 10).map((c) => (
                <li
                  key={c.customerId}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <Link
                    href={`/tableau-de-bord/clients/${c.customerId}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {c.visits} visites en 12 mois
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              Un client devient régulier à partir de 3 visites en 12 mois.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <>
      <PageHeader
        title="Analyses"
        description="Ce que révèlent vos rendez-vous, et ce que vous pouvez en faire."
      />
      <Suspense fallback={<Skeleton className="h-[520px]" />}>
        <Content />
      </Suspense>
    </>
  );
}
