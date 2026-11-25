import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Map as MapIcon } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { PLAN_DAYS } from "@/domain/marketing/autopilot";
import { formatInTz } from "@/lib/format";
import { requirePermission } from "@/server/auth/session";
import { getActivePlan } from "@/server/marketing/autopilot";
import { StopPlanButton, TaskItem } from "./controls";

export const metadata: Metadata = { title: "Plan d'action" };

async function Content() {
  const ctx = await requirePermission("marketing.manage");
  const a = await getActivePlan(ctx);
  const tz = ctx.organization.timezone;
  if (!a)
    return (
      <EmptyState
        icon={<MapIcon />}
        title="Aucun Autopilot en cours"
        description="Créez une stratégie 30 jours pour l'un de vos produits, puis lancez l'Autopilot : chaque jour, 3 actions simples à cocher."
        action={
          <Button asChild>
            <Link href="/tableau-de-bord/strategies">Créer une stratégie</Link>
          </Button>
        }
      />
    );
  const { progress } = a;
  const view = (t: (typeof a.tasks)[number], late = false) => ({
    id: t.id,
    title: t.title,
    detail: t.detail,
    channel: t.channel,
    done: Boolean(t.doneAt),
    dayLabel: late ? `Jour ${t.day}` : undefined,
  });
  return (
    <div className="grid gap-6" data-testid="marketing-autopilot">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Jour"
          value={progress.finished ? "Terminé" : `${a.day} / ${PLAN_DAYS}`}
          hint={a.productName}
        />
        <StatCard
          label="Actions faites"
          value={`${progress.done} / ${progress.total}`}
          hint={`${progress.percent} %`}
        />
        <StatCard label="En retard" value={String(progress.late)} hint="Actions des jours passés" />
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Progression de l'Autopilot"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-primary" style={{ width: `${progress.percent}%` }} />
      </div>
      {progress.finished ? (
        <Alert variant="success">
          Les 30 jours sont terminés. Faites le bilan dans vos statistiques, puis créez une
          nouvelle stratégie à partir de ce que vous avez appris.
        </Alert>
      ) : (
        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">
            Aujourd&apos;hui · {formatInTz(`${a.dateOfDay(a.day)}T12:00:00Z`, tz, "EEEE d MMMM")}
          </h2>
          <ul className="grid gap-2" data-testid="today-tasks">
            {a.today.map((t) => (
              <TaskItem key={t.id} task={view(t)} />
            ))}
          </ul>
        </section>
      )}
      {a.late.length ? (
        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">À rattraper</h2>
          <ul className="grid gap-2" data-testid="late-tasks">
            {a.late.slice(0, 9).map((t) => (
              <TaskItem key={t.id} task={view(t, true)} />
            ))}
          </ul>
          {a.late.length > 9 ? (
            <p className="text-sm text-muted-foreground">
              Et {a.late.length - 9} autres. Pas de panique : avancez à votre rythme.
            </p>
          ) : null}
        </section>
      ) : null}
      <details className="rounded-2xl border bg-card p-4">
        <summary className="cursor-pointer font-medium">Tout le plan sur 30 jours</summary>
        <ol className="mt-3 grid gap-3">
          {Array.from({ length: PLAN_DAYS }, (_, i) => i + 1).map((d) => {
            const list = a.tasks.filter((t) => t.day === d);
            return (
              <li key={d}>
                <p className="text-sm font-semibold">
                  Jour {d} · {formatInTz(`${a.dateOfDay(d)}T12:00:00Z`, tz, "EEE d MMM")}
                </p>
                <ul className="text-sm">
                  {list.map((t) => (
                    <li key={t.id} className={t.doneAt ? "text-muted-foreground line-through" : ""}>
                      {t.title}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </details>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary">
          <Link href={`/tableau-de-bord/strategies/${a.plan.strategyId}` as Route}>
            Voir la stratégie
          </Link>
        </Button>
        <StopPlanButton />
      </div>
    </div>
  );
}

export default function MarketingAutopilotPage() {
  return (
    <>
      <PageHeader
        title="Plan d'action"
        description="Chaque jour, 3 actions marketing simples tirées de votre stratégie. Cochez-les au fur et à mesure."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content />
      </Suspense>
    </>
  );
}
