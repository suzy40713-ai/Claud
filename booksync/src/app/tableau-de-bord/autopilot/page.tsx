import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertTriangle, CheckCircle2, CircleSlash, Clock3, Hourglass, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { PLANS } from "@/domain/billing/plans";
import { can } from "@/domain/permissions";
import { formatInTz, fromNow } from "@/lib/format";
import { requirePermission } from "@/server/auth/session";
import {
  getAutopilotOverview,
  listActivity,
  listScheduled,
  NOTIFICATION_TITLES,
  type ActivityEntry,
} from "@/server/autopilot/activity";
import { buildDailySummary } from "@/server/autopilot/daily-summary";
import { listAutomations } from "@/server/autopilot/rules";
import { AutomationList, type AutomationItem } from "./automation-list";

export const metadata: Metadata = { title: "Autopilot" };

const STATUS: Record<
  ActivityEntry["status"],
  {
    label: string;
    variant: "success" | "primary" | "destructive" | "neutral" | "warning";
    icon: typeof CheckCircle2;
  }
> = {
  done: { label: "Effectuée", variant: "success", icon: CheckCircle2 },
  pending: { label: "À confirmer", variant: "warning", icon: Hourglass },
  failed: { label: "Erreur", variant: "destructive", icon: XCircle },
  skipped: { label: "Non effectuée", variant: "neutral", icon: CircleSlash },
  expired: { label: "Expirée", variant: "neutral", icon: Clock3 },
  cancelled: { label: "Annulée", variant: "neutral", icon: CircleSlash },
};

const ORIGIN: Record<ActivityEntry["origin"], string> = {
  automation: "Automatisation",
  assistant: "Assistant",
  waitlist: "Liste d'attente",
  user: "Réglage",
};

function ActivityList({ entries, tz }: { entries: ActivityEntry[]; tz: string }) {
  if (!entries.length) {
    return (
      <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
        Aucune opération pour l&apos;instant. Les actions d&apos;Autopilot apparaîtront ici dès la
        prochaine réservation.
      </p>
    );
  }
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
      {entries.map((e) => {
        const s = STATUS[e.status];
        const Icon = s.icon;
        return (
          <li key={e.id} className="flex gap-3 px-4 py-3 sm:px-5" data-testid="autopilot-activity">
            <Icon
              aria-hidden
              className={`mt-0.5 size-4 shrink-0 ${e.status === "failed" ? "text-destructive" : e.status === "done" ? "text-success" : "text-muted-foreground"}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{e.title}</p>
              {e.detail ? (
                <p className="truncate text-[13px] text-muted-foreground">{e.detail}</p>
              ) : null}
              {e.error ? <p className="text-[13px] text-muted-foreground">{e.error}</p> : null}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {ORIGIN[e.origin]} ·{" "}
                <time title={formatInTz(e.at, tz, "d MMM yyyy HH:mm")}>{fromNow(e.at)}</time>
              </p>
            </div>
            <Badge variant={s.variant} className="h-fit shrink-0">
              {s.label}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

async function Content() {
  const ctx = await requirePermission("autopilot.view");
  const tz = ctx.organization.timezone;
  const [overview, automations, activity, errors, scheduled] = await Promise.all([
    getAutopilotOverview(ctx),
    listAutomations(ctx),
    listActivity(ctx, { limit: 30 }),
    listActivity(ctx, { limit: 10, onlyErrors: true }),
    listScheduled(ctx),
  ]);
  const items: AutomationItem[] = automations.map((a) => ({
    key: a.key,
    title: a.title,
    description: a.description,
    active: a.active,
    enabled: a.enabled,
    locked: Boolean(a.locked),
    includedInPlan: a.includedInPlan,
    minPlanName: PLANS[a.minPlan].name,
  }));
  const canManage = can(ctx.role, "autopilot.manage");
  const pending = activity.filter((a) => a.status === "pending");
  const tomorrow = ctx.plan.id === "pro" ? await buildDailySummary(ctx.organization) : null;

  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Actions effectuées"
          value={String(overview.done)}
          hint="30 derniers jours"
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Programmées"
          value={String(overview.scheduled)}
          hint="rappels à venir"
          icon={<Clock3 />}
        />
        <StatCard
          label="À confirmer"
          value={String(overview.toConfirm)}
          hint="en attente de votre accord"
          icon={<Hourglass />}
        />
        <StatCard
          label="Erreurs"
          value={String(overview.errors)}
          hint="30 derniers jours"
          icon={<AlertTriangle />}
        />
      </div>

      {!canManage ? (
        <p className="rounded-lg border bg-subtle px-4 py-3 text-sm text-muted-foreground">
          Seul le propriétaire peut activer ou désactiver les automatisations.
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <AutomationList
          title="Automatisations actives"
          items={items.filter((i) => i.active)}
          canManage={canManage}
          empty="Aucune automatisation active."
        />
        <AutomationList
          title="Automatisations désactivées"
          items={items.filter((i) => !i.active)}
          canManage={canManage}
          empty="Toutes vos automatisations sont actives."
        />
      </div>

      {pending.length ? (
        <section className="grid gap-3">
          <h2 className="text-[15px] font-semibold">En attente de confirmation</h2>
          <ActivityList entries={pending} tz={tz} />
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="grid content-start gap-3">
          <h2 className="text-[15px] font-semibold">Historique des opérations</h2>
          <ActivityList entries={activity} tz={tz} />
        </section>
        <div className="grid content-start gap-8">
          {tomorrow ? (
            <section className="grid gap-3" data-testid="tomorrow-summary">
              <h2 className="text-[15px] font-semibold">Demain · {tomorrow.dateLabel}</h2>
              <div className="grid gap-3 rounded-xl border bg-card p-4 text-sm shadow-xs">
                <p>
                  <strong>{tomorrow.appointments.length}</strong> rendez-vous
                  {tomorrow.appointments.length
                    ? ` · premier à ${tomorrow.appointments[0].time}, dernier à ${tomorrow.appointments.at(-1)!.time}`
                    : ""}
                </p>
                {tomorrow.freeSlots ? (
                  <p className="text-muted-foreground">
                    {tomorrow.freeSlots.count} créneau{tomorrow.freeSlots.count > 1 ? "x" : ""}{" "}
                    libre{tomorrow.freeSlots.count > 1 ? "s" : ""} pour «{" "}
                    {tomorrow.freeSlots.serviceName} »
                  </p>
                ) : null}
                <p className="text-muted-foreground">
                  {tomorrow.cancellations.length} annulation
                  {tomorrow.cancellations.length > 1 ? "s" : ""} ces dernières 24 h ·{" "}
                  {tomorrow.waitlist.active} en liste d&apos;attente
                </p>
                <p className="text-xs text-muted-foreground">
                  Envoyé chaque soir à 19 h si le « Résumé quotidien » est actif.
                </p>
              </div>
            </section>
          ) : null}
          <section className="grid gap-3">
            <h2 className="text-[15px] font-semibold">Prochaines actions</h2>
            {scheduled.length ? (
              <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
                {scheduled.map((s) => (
                  <li key={s.id} className="px-4 py-3" data-testid="autopilot-scheduled">
                    <p className="text-sm font-medium">{NOTIFICATION_TITLES[s.type]}</p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {s.firstName} {s.lastName} · {s.serviceName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatInTz(s.scheduledFor, tz, "EEE d MMM 'à' HH:mm")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                Aucun rappel programmé.
              </p>
            )}
          </section>
          <section className="grid gap-3">
            <h2 className="text-[15px] font-semibold">Erreurs récentes</h2>
            {errors.length ? (
              <ActivityList entries={errors} tz={tz} />
            ) : (
              <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
                Aucune erreur. Tout fonctionne.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AutopilotPage() {
  return (
    <>
      <PageHeader
        title="Autopilot"
        description="BookSync s'occupe des tâches répétitives de vos rendez-vous. Vous gardez la main sur chaque automatisation."
      />
      <Suspense fallback={<Skeleton className="h-[480px]" />}>
        <Content />
      </Suspense>
    </>
  );
}
