import type { Metadata } from "next";
import { Suspense } from "react";
import { Ban, CalendarCheck2, Euro, UserX } from "lucide-react";
import { RankBars, SimpleBarChart } from "@/components/charts/bar-chart";
import { UpgradeNotice } from "@/components/settings/section";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { addDays, localDateOf } from "@/domain/availability/engine";
import { formatCents, formatInTz } from "@/lib/format";
import { requirePermission } from "@/server/auth/session";
import { getAnalytics } from "@/server/stats";
import { RangePicker } from "./range-picker";

export const metadata: Metadata = { title: "Statistiques" };

const pct = (v: number) => `${(v * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

async function Content({ searchParams }: { searchParams: Promise<{ du?: string; au?: string }> }) {
  const sp = await searchParams;
  const ctx = await requirePermission("stats.view");
  const tz = ctx.organization.timezone;
  const today = localDateOf(new Date(), tz);
  const valid = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
  let from = valid(sp.du) ?? addDays(today, -29);
  let to = valid(sp.au) ?? today;
  if (from > to) [from, to] = [to, from];
  if (Date.parse(to) - Date.parse(from) > 366 * 86_400_000) from = addDays(to, -366);
  const a = await getAnalytics(ctx, { from, to });

  return (
    <div className="grid gap-6">
      <RangePicker from={from} to={to} today={today} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Rendez-vous"
          value={String(a.totals.bookings)}
          hint="hors annulations"
          icon={<CalendarCheck2 />}
        />
        <StatCard
          label="Chiffre d'affaires enregistré"
          value={formatCents(a.totals.revenueCents)}
          hint="rendez-vous passés non annulés"
          icon={<Euro />}
        />
        <StatCard
          label="Taux d'annulation"
          value={pct(a.totals.cancellationRate)}
          hint={`${a.totals.cancelled} annulation${a.totals.cancelled > 1 ? "s" : ""}`}
          icon={<Ban />}
        />
        <StatCard
          label="Taux d'absence"
          value={pct(a.totals.noShowRate)}
          hint={`${a.totals.noShow} absence${a.totals.noShow > 1 ? "s" : ""} signalée${a.totals.noShow > 1 ? "s" : ""}`}
          icon={<UserX />}
        />
      </div>

      <section className="rounded-xl border bg-card p-4 sm:p-5">
        <h2 className="mb-4 text-[15px] font-semibold">Services les plus réservés</h2>
        {a.services.length ? (
          <RankBars
            rows={a.services.map((s) => ({
              label: s.name,
              value: s.n,
              sub: formatCents(s.revenue),
            }))}
          />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aucun rendez-vous sur cette période.
          </p>
        )}
      </section>

      {a.advanced ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border bg-card p-4 sm:p-5">
              <h2 className="text-[15px] font-semibold">Évolution mensuelle</h2>
              <p className="mb-4 text-[13px] text-muted-foreground">
                Rendez-vous des 12 derniers mois, hors annulations
              </p>
              <SimpleBarChart
                caption="Rendez-vous par mois"
                valueLabel="Rendez-vous"
                data={a.monthly.map((m) => ({
                  label: formatInTz(`${m.month}-15T12:00:00Z`, tz, "MMM"),
                  value: m.n,
                  tooltipLabel: formatInTz(`${m.month}-15T12:00:00Z`, tz, "MMMM yyyy"),
                }))}
              />
            </section>
            <section className="rounded-xl border bg-card p-4 sm:p-5">
              <h2 className="text-[15px] font-semibold">Chiffre d&apos;affaires mensuel</h2>
              <p className="mb-4 text-[13px] text-muted-foreground">12 derniers mois</p>
              <SimpleBarChart
                caption="Chiffre d'affaires par mois"
                valueLabel="CA"
                format={(v) => formatCents(v).replace(/,00\s/, " ")}
                data={a.monthly.map((m) => ({
                  label: formatInTz(`${m.month}-15T12:00:00Z`, tz, "MMM"),
                  value: m.revenue,
                  tooltipLabel: formatInTz(`${m.month}-15T12:00:00Z`, tz, "MMMM yyyy"),
                }))}
              />
            </section>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border bg-card p-4 sm:p-5">
              <h2 className="mb-4 text-[15px] font-semibold">Activité des employés</h2>
              {a.staff.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-[12px] text-muted-foreground">
                      <tr>
                        <th className="pb-2 font-medium">Employé</th>
                        <th className="pb-2 text-right font-medium">RDV</th>
                        <th className="pb-2 text-right font-medium">Absences</th>
                        <th className="pb-2 text-right font-medium">CA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {a.staff.map((s) => (
                        <tr key={s.name}>
                          <td className="py-2">
                            <span
                              className="mr-2 inline-block size-2 rounded-full"
                              style={{ backgroundColor: s.color }}
                            />
                            {s.name}
                          </td>
                          <td className="py-2 text-right tabular-nums">{s.n}</td>
                          <td className="py-2 text-right tabular-nums">{s.noShow}</td>
                          <td className="py-2 text-right tabular-nums">{formatCents(s.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucune activité.</p>
              )}
            </section>
            <section className="rounded-xl border bg-card p-4 sm:p-5">
              <h2 className="text-[15px] font-semibold">Jours les plus demandés</h2>
              <p className="mb-4 text-[13px] text-muted-foreground">
                {a.sources.find((s) => s.source === "online")?.n ?? 0} réservations en ligne ·{" "}
                {a.sources.find((s) => s.source === "manual")?.n ?? 0} ajoutées manuellement
              </p>
              <SimpleBarChart
                caption="Rendez-vous par jour de la semaine"
                valueLabel="Rendez-vous"
                height={180}
                data={a.weekdays.map((w) => ({ label: DOW[w.dow - 1], value: w.n }))}
              />
            </section>
          </div>
        </>
      ) : (
        <UpgradeNotice feature="Les statistiques avancées (évolution mensuelle, activité des employés, jours les plus demandés)" />
      )}
    </div>
  );
}

export default function StatsPage(props: PageProps<"/tableau-de-bord/statistiques">) {
  return (
    <>
      <PageHeader title="Statistiques" description="Calculées à partir de vos rendez-vous réels." />
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <Content searchParams={props.searchParams as Promise<{ du?: string; au?: string }>} />
      </Suspense>
    </>
  );
}
