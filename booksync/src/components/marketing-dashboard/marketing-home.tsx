import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, GraduationCap, Package, Rocket, Target, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { formatCents, formatInTz } from "@/lib/format";
import type { OrgContext } from "@/server/auth/session";
import { getActivePlan } from "@/server/marketing/autopilot";
import { listProducts } from "@/server/marketing/products";
import { hasAnySale, monthResults } from "@/server/marketing/results";
import { ALL_LESSONS } from "@/domain/academy/lessons";
import { planAtLeast } from "@/domain/billing/plans";
import { journey, profitability } from "@/domain/marketing/profitability";
import { academyProgress } from "@/server/academy/progress";
import { listGenerations } from "@/server/ai/gateway";
import { ANALYSIS_KIND } from "@/server/marketing/analysis";
import { ActivityPanel } from "./activity";

/** Accueil : prochaine étape, objectif de rentabilité, Autopilot du jour, Académie. */
export async function MarketingHome({ ctx }: { ctx: OrgContext }) {
  const [products, plan, month, academy, analyses, strategies, sold] = await Promise.all([
    listProducts(ctx),
    getActivePlan(ctx),
    monthResults(ctx),
    academyProgress(ctx),
    listGenerations(ctx, { kind: ANALYSIS_KIND, limit: 1 }),
    listGenerations(ctx, { kind: "strategy", limit: 1 }),
    hasAnySale(ctx),
  ]);
  const firstName = ctx.user.name.split(/\s+/)[0];
  const steps = journey({
    hasProduct: products.length > 0,
    hasAnalysis: analyses.length > 0,
    hasStrategy: strategies.length > 0,
    hasPlan: Boolean(plan),
    hasSale: sold,
  });
  const next = steps.find((x) => !x.done) ?? null;
  const goal = profitability(ctx.plan.priceCents, month.revenueCents);
  const lesson = ALL_LESSONS.find(
    (l) => !academy.done.has(l.id) && planAtLeast(ctx.plan.id, l.minPlan),
  );
  return (
    <div className="grid gap-6" data-testid="marketing-home">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
          Bonjour {firstName}
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground first-letter:uppercase">
          {formatInTz(new Date(), ctx.organization.timezone, "EEEE d MMMM yyyy")}
        </p>
      </div>

      {goal ? (
        <section
          className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs"
          data-testid="profit-goal"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <Target className="size-4 text-primary" /> Rentabiliser mon abonnement
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {goal.reached
                  ? `Abonnement rentabilisé ce mois-ci 🎉 Tout ce que vous vendez en plus, c'est pour vous (+${formatCents(goal.profitCents)}).`
                  : `Ventes de ${formatCents(month.revenueCents)} ce mois-ci sur ${formatCents(ctx.plan.priceCents)} : encore ${formatCents(goal.remainingCents)} pour rentabiliser votre forfait ${ctx.plan.name}.`}
              </p>
            </div>
            <span className="text-2xl font-semibold tabular-nums">{goal.percent} %</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Rentabilité de l'abonnement"
            aria-valuenow={goal.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={goal.reached ? "h-full bg-success" : "h-full bg-primary"}
              style={{ width: `${goal.percent}%` }}
            />
          </div>
          <div>
            <Button asChild size="sm" variant="secondary">
              <Link href="/tableau-de-bord/resultats">Noter une vente</Link>
            </Button>
          </div>
        </section>
      ) : (
        <section
          className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between"
          data-testid="first-sale-goal"
        >
          <p className="text-sm">
            <strong>Votre objectif : votre première vente.</strong>{" "}
            {month.sales > 0
              ? `${month.sales} vente${month.sales > 1 ? "s" : ""} notée${month.sales > 1 ? "s" : ""} ce mois-ci, bravo !`
              : "Avec Starter : Académie complète, outils illimités et objectif de rentabilité suivi chaque mois."}
          </p>
          <Button asChild size="sm">
            <Link href="/tableau-de-bord/abonnement">Passer à Starter</Link>
          </Button>
        </section>
      )}

      {next ? (
        <section
          className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs"
          data-testid="journey"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Votre prochaine étape</p>
              <h2 className="text-lg font-semibold">{next.label}</h2>
            </div>
            <Button asChild>
              <Link href={next.href as Route}>
                C&apos;est parti <ArrowRight />
              </Link>
            </Button>
          </div>
          <ol className="grid gap-1.5 text-sm sm:grid-cols-5">
            {steps.map((x, i) => (
              <li
                key={x.id}
                className={
                  x.done ? "text-muted-foreground line-through" : x === next ? "font-semibold" : ""
                }
              >
                {i + 1}. {x.label}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {plan ? (
        <section
          className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs"
          data-testid="home-autopilot"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <Rocket className="size-4 text-primary" />
              {plan.progress.finished ? "Autopilot terminé" : `Autopilot · jour ${plan.day} / 30`}
            </h2>
            <span className="text-sm text-muted-foreground">
              {plan.progress.done} / {plan.progress.total} actions
            </span>
          </div>
          {plan.progress.finished ? null : (
            <ul className="grid gap-1 text-sm">
              {plan.today.map((task) => (
                <li
                  key={task.id}
                  className={task.doneAt ? "text-muted-foreground line-through" : ""}
                >
                  {task.title}
                </li>
              ))}
            </ul>
          )}
          <div>
            <Button asChild size="sm">
              <Link href="/tableau-de-bord/autopilot-marketing">Faire mes actions du jour</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Ventes ce mois-ci"
          value={String(month.sales)}
          hint={`Chiffre d'affaires : ${formatCents(month.revenueCents)}`}
          icon={<Wallet />}
        />
        <StatCard
          label="Académie"
          value={`${academy.count} / ${academy.total}`}
          hint="Leçons terminées"
          icon={<GraduationCap />}
        />
      </div>

      <ActivityPanel ctx={ctx} />

      {lesson ? (
        <section className="flex flex-col gap-3 rounded-2xl border bg-primary-soft p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="font-semibold">Leçon du jour :</span> {lesson.title} ({lesson.minutes}{" "}
            min)
          </p>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/tableau-de-bord/academie/${lesson.id}` as Route}>Lire la leçon</Link>
          </Button>
        </section>
      ) : null}
    </div>
  );
}

/** Encart « Mes produits » affiché en haut de l'accueil quand le module rendez-vous est actif. */
export async function MarketingStrip({ ctx }: { ctx: OrgContext }) {
  const products = await listProducts(ctx);
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between"
      data-testid="marketing-strip"
    >
      <p className="flex items-center gap-2 text-sm">
        <Package className="size-4 text-primary" />
        <span>
          <strong>Copilote marketing</strong> ·{" "}
          {products.length
            ? `${products.length} produit${products.length > 1 ? "s" : ""} suivi${products.length > 1 ? "s" : ""}`
            : "ajoutez ce que vous vendez pour préparer votre marketing"}
        </span>
      </p>
      <Button asChild size="sm" variant="secondary">
        <Link
          href={products.length ? "/tableau-de-bord/produits" : "/tableau-de-bord/produits/nouveau"}
        >
          {products.length ? "Mes produits" : "Ajouter un produit"}
        </Link>
      </Button>
    </div>
  );
}
