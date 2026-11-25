import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, Circle, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ACADEMY } from "@/domain/academy/lessons";
import { PLANS, planAtLeast } from "@/domain/billing/plans";
import { academyProgress } from "@/server/academy/progress";
import { requireOrg } from "@/server/auth/session";

export const metadata: Metadata = { title: "Académie" };

async function Content() {
  const ctx = await requireOrg();
  const p = await academyProgress(ctx);
  const percent = Math.round((p.count / p.total) * 100);
  return (
    <div className="grid gap-6" data-testid="academy">
      <div className="rounded-2xl border bg-card p-5 shadow-xs">
        <p className="text-sm font-medium">
          {p.count} / {p.total} leçons terminées
        </p>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Progression dans l'Académie"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
      </div>
      {ACADEMY.map((m) => (
        <section key={m.id} className="grid gap-3">
          <h2 className="text-lg font-semibold">{m.title}</h2>
          <ul className="grid gap-2">
            {m.lessons.map((l) => {
              const open = planAtLeast(ctx.plan.id, l.minPlan);
              const done = p.done.has(l.id);
              return (
                <li key={l.id}>
                  <Link
                    href={`/tableau-de-bord/academie/${l.id}` as Route}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 hover:border-primary/40"
                  >
                    <span className="flex items-center gap-3">
                      {done ? (
                        <CheckCircle2
                          className="size-5 shrink-0 text-success"
                          aria-label="Terminée"
                        />
                      ) : open ? (
                        <Circle className="size-5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Lock
                          className="size-5 shrink-0 text-muted-foreground"
                          aria-label="Verrouillée"
                        />
                      )}
                      <span className="font-medium">{l.title}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                      {open ? (
                        `${l.minutes} min`
                      ) : (
                        <Badge variant="outline">{PLANS[l.minPlan].name}</Badge>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function AcademyPage() {
  return (
    <>
      <PageHeader
        title="Académie"
        description="Apprends le business pas à pas : des leçons de 5 minutes, chacune avec une action à faire tout de suite."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content />
      </Suspense>
    </>
  );
}
