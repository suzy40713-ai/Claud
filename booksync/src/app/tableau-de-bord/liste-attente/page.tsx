import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Hourglass } from "lucide-react";
import { UpgradeNotice } from "@/components/settings/section";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, localDateOf } from "@/domain/availability/engine";
import { can } from "@/domain/permissions";
import { describePreferences, OFFER_HOLD_MINUTES, OFFERS_PER_SLOT } from "@/domain/waitlist/match";
import { formatInTz, fromNow } from "@/lib/format";
import { requirePermission } from "@/server/auth/session";
import { listAutomations } from "@/server/autopilot/rules";
import { listBookableOptions } from "@/server/waitlist/options";
import { listWaitlist } from "@/server/waitlist/service";
import { AddEntryButton, CancelEntryButton } from "./waitlist-client";

export const metadata: Metadata = { title: "Liste d'attente" };

const ENTRY_STATUS = {
  active: { label: "En attente", variant: "primary" },
  booked: { label: "Rendez-vous obtenu", variant: "success" },
  cancelled: { label: "Retiré", variant: "neutral" },
  expired: { label: "Période terminée", variant: "neutral" },
} as const;

const OFFER_STATUS = {
  pending: "en attente de réponse",
  accepted: "acceptée",
  expired: "expirée sans réponse",
  superseded: "créneau pris par un autre client",
} as const;

function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

async function Content() {
  const ctx = await requirePermission("customers.view_all");
  const tz = ctx.organization.timezone;
  const isPro = ctx.plan.id === "pro";
  if (!isPro) {
    return (
      <div className="grid gap-4">
        <UpgradeNotice feature="La liste d'attente intelligente" />
        <EmptyState
          icon={<Hourglass />}
          title="Ne perdez plus un créneau annulé"
          description="Vos clients s'inscrivent sur la liste d'attente ; dès qu'un rendez-vous est annulé, BookSync propose le créneau aux personnes compatibles et le premier qui confirme l'obtient."
        />
      </div>
    );
  }
  const [entries, automations, options] = await Promise.all([
    listWaitlist(ctx),
    listAutomations(ctx),
    listBookableOptions(ctx),
  ]);
  const enabled = automations.find((a) => a.key === "waitlist")?.active ?? false;
  const canManage = can(ctx.role, "customers.manage");
  const today = localDateOf(new Date(), tz);
  const active = entries.filter((e) => e.status === "active");
  const past = entries.filter((e) => e.status !== "active").slice(0, 30);

  return (
    <div className="grid gap-6">
      {!enabled ? (
        <p className="rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          L&apos;automatisation « Liste d&apos;attente intelligente » est désactivée : aucun créneau
          ne sera proposé.{" "}
          <Link href="/tableau-de-bord/autopilot" className="font-semibold underline">
            L&apos;activer dans Autopilot
          </Link>
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Créneau annulé → proposé aux {OFFERS_PER_SLOT} premiers inscrits compatibles, valable{" "}
          {OFFER_HOLD_MINUTES / 60} h. Le premier qui confirme l&apos;obtient.
        </p>
        {canManage && options.services.length ? (
          <AddEntryButton
            services={options.services}
            staff={options.staff}
            today={today}
            maxDate={addDays(today, 90)}
          />
        ) : null}
      </div>

      <section className="grid gap-3">
        <h2 className="text-[15px] font-semibold">
          En attente <span className="text-muted-foreground">({active.length})</span>
        </h2>
        {active.length ? (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
            {active.map((e) => {
              const offer = e.offers[0];
              return (
                <li
                  key={e.id}
                  className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:px-5"
                  data-testid="waitlist-entry"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      <Link
                        href={`/tableau-de-bord/clients/${e.customerId}`}
                        className="hover:underline"
                      >
                        {e.firstName} {e.lastName}
                      </Link>{" "}
                      <span className="font-normal text-muted-foreground">· {e.serviceName}</span>
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      Du {shortDate(e.dateFrom)} au {shortDate(e.dateTo)} · {describePreferences(e)}
                      {e.staffName ? ` · avec ${e.staffName}` : ""}
                    </p>
                    {offer ? (
                      <p className="mt-1 text-[13px]">
                        Dernière proposition :{" "}
                        {formatInTz(offer.startsAt, tz, "EEE d MMM 'à' HH:mm")} —{" "}
                        <span className="text-muted-foreground">{OFFER_STATUS[offer.status]}</span>
                      </p>
                    ) : null}
                    {e.note ? (
                      <p className="mt-1 text-[13px] text-muted-foreground italic">« {e.note} »</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {e.source === "online" ? "En ligne" : "Ajouté"} {fromNow(e.createdAt)}
                    </span>
                    {canManage ? <CancelEntryButton id={e.id} /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<Hourglass />}
            title="Personne en attente"
            description="Vos clients peuvent s'inscrire depuis votre page de réservation, ou vous pouvez les inscrire vous-même."
          />
        )}
      </section>

      {past.length ? (
        <section className="grid gap-3">
          <h2 className="text-[15px] font-semibold">Historique</h2>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
            {past.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <p className="min-w-0 truncate text-sm">
                  {e.firstName} {e.lastName}{" "}
                  <span className="text-muted-foreground">· {e.serviceName}</span>
                </p>
                <Badge variant={ENTRY_STATUS[e.status].variant}>
                  {ENTRY_STATUS[e.status].label}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <>
      <PageHeader
        title="Liste d'attente"
        description="Les créneaux annulés sont automatiquement reproposés à vos clients en attente."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content />
      </Suspense>
    </>
  );
}
