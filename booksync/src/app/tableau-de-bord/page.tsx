import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, CalendarRange, Euro, ExternalLink, Rocket, UsersRound } from "lucide-react";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { can } from "@/domain/permissions";
import { env } from "@/lib/env";
import { formatCents, formatInTz, fromNow } from "@/lib/format";
import { requireOrg } from "@/server/auth/session";
import { getMonthlyUsage } from "@/server/booking/book";
import { getSetupProgress } from "@/server/onboarding";
import { getOverview } from "@/server/stats";

export const metadata: Metadata = { title: "Vue générale" };

async function Content({ searchParams }: { searchParams: Promise<{ acces?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireOrg();
  const tz = ctx.organization.timezone;
  const [o, usage, setup] = await Promise.all([
    getOverview(ctx),
    getMonthlyUsage(ctx.organization.id, tz),
    can(ctx.role, "organization.update") ? getSetupProgress(ctx) : Promise.resolve(null),
  ]);
  const publicUrl = `${env.NEXT_PUBLIC_APP_URL}/${ctx.organization.slug}`;
  const firstName = ctx.user.name.split(/\s+/)[0];
  const limit = ctx.plan.limits.bookingsPerMonth;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            Bonjour {firstName}
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground first-letter:uppercase">
            {formatInTz(new Date(), tz, "EEEE d MMMM yyyy")}
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-1 rounded-lg border bg-card py-1 pr-1 pl-3 text-sm">
          <span className="min-w-0 truncate font-mono text-[13px] text-muted-foreground">
            {publicUrl.replace(/^https?:\/\//, "")}
          </span>
          <CopyButton value={publicUrl} />
          <Button asChild variant="ghost" size="sm" aria-label="Ouvrir ma page de réservation">
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink />
            </a>
          </Button>
        </div>
      </div>

      {sp.acces === "refuse" ? (
        <Alert variant="error">
          Vous n&apos;avez pas accès à cette page avec votre rôle actuel.
        </Alert>
      ) : null}

      {setup && setup.remaining > 0 ? (
        <Link
          href="/tableau-de-bord/demarrage"
          className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary-soft p-4 transition-colors hover:border-primary/40"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Rocket className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-primary-soft-foreground">
              Terminez l&apos;installation de BookSync
            </span>
            <span className="block text-sm text-primary-soft-foreground/80">
              {setup.done} étape{setup.done > 1 ? "s" : ""} sur {setup.total} terminée
              {setup.done > 1 ? "s" : ""}
            </span>
          </span>
          <span className="text-sm font-semibold text-primary">Continuer →</span>
        </Link>
      ) : null}

      {limit !== null && can(ctx.role, "billing.manage") ? (
        <div className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              <span className="tabular-nums" data-testid="usage">
                {usage} / {limit}
              </span>{" "}
              réservations ce mois-ci (forfait {ctx.plan.name})
            </p>
            <div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-muted">
              <div
                className={usage >= limit ? "h-full bg-warning" : "h-full bg-primary"}
                style={{ width: `${Math.min(100, (usage / limit) * 100)}%` }}
              />
            </div>
          </div>
          <Button asChild variant={usage >= limit ? "primary" : "secondary"} size="sm">
            <Link href="/tableau-de-bord/abonnement">Réservations illimitées</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Aujourd'hui"
          value={String(o.todayCount)}
          hint="rendez-vous"
          icon={<CalendarDays />}
        />
        <StatCard
          label="Cette semaine"
          value={String(o.weekCount)}
          hint="rendez-vous"
          icon={<CalendarRange />}
        />
        <StatCard
          label="Clients"
          value={String(o.customers)}
          hint={
            ctx.plan.limits.customers
              ? `sur ${ctx.plan.limits.customers} (forfait ${ctx.plan.name})`
              : "au total"
          }
          icon={<UsersRound />}
        />
        <StatCard
          label="CA enregistré ce mois"
          value={formatCents(o.revenueCents)}
          hint="rendez-vous passés non annulés"
          icon={<Euro />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border bg-card p-4 sm:p-5">
          <h2 className="text-[15px] font-semibold">Rendez-vous par jour</h2>
          <p className="mb-4 text-[13px] text-muted-foreground">
            30 derniers jours, hors annulations
          </p>
          <SimpleBarChart
            caption="Nombre de rendez-vous par jour sur les 30 derniers jours"
            valueLabel="Rendez-vous"
            data={o.series.map((d) => ({
              label: d.date.slice(8),
              value: d.count,
              tooltipLabel: formatInTz(`${d.date}T12:00:00Z`, tz, "EEEE d MMMM"),
            }))}
          />
        </section>

        <section className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
            <h2 className="text-[15px] font-semibold">Prochains rendez-vous</h2>
            <Link
              href="/tableau-de-bord/calendrier"
              className="text-sm font-medium text-primary hover:underline"
            >
              Calendrier
            </Link>
          </div>
          {o.upcoming.length ? (
            <ul className="divide-y">
              {o.upcoming.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-[11px] text-muted-foreground uppercase">
                      {formatInTz(a.startsAt, tz, "EEE d")}
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatInTz(a.startsAt, tz, "HH:mm")}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {a.firstName} {a.lastName}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground">{a.serviceName}</p>
                  </div>
                  <Avatar name={a.staffName} color={a.staffColor} className="size-7 text-[10px]" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Aucun rendez-vous à venir. Partagez votre page de réservation !
            </p>
          )}
        </section>
      </div>

      <section className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
          <h2 className="text-[15px] font-semibold">Réservations récentes</h2>
          <Link
            href={"/tableau-de-bord/reservations?periode=all" as Route}
            className="text-sm font-medium text-primary hover:underline"
          >
            Tout voir
          </Link>
        </div>
        {o.recent.length ? (
          <ul className="divide-y">
            {o.recent.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 sm:px-5"
              >
                <p className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">
                    {a.firstName} {a.lastName}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    · {a.serviceName} · {formatInTz(a.startsAt, tz, "d MMM 'à' HH:mm")}
                  </span>
                </p>
                <Badge variant={a.source === "online" ? "primary" : "neutral"}>
                  {a.source === "online" ? "En ligne" : "Manuel"}
                </Badge>
                {a.status === "cancelled" ? <Badge variant="destructive">Annulé</Badge> : null}
                <span className="text-xs text-muted-foreground">{fromNow(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Aucune réservation pour l&apos;instant.
          </p>
        )}
      </section>
    </div>
  );
}

export default function OverviewPage(props: PageProps<"/tableau-de-bord">) {
  return (
    <Suspense
      fallback={
        <div className="grid gap-6">
          <Skeleton className="h-16" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      }
    >
      <Content searchParams={props.searchParams as Promise<{ acces?: string }>} />
    </Suspense>
  );
}
