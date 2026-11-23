import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Package, Plus, Rocket, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { categoryLabel } from "@/domain/marketing/product";
import { formatCents, formatInTz } from "@/lib/format";
import type { OrgContext } from "@/server/auth/session";
import { totals } from "@/domain/marketing/results";
import { aiQuota } from "@/server/ai/gateway";
import { getActivePlan } from "@/server/marketing/autopilot";
import { listProducts } from "@/server/marketing/products";
import { listResults } from "@/server/marketing/results";

/** Accueil du copilote marketing : uniquement des données réelles de l'entreprise. */
export async function MarketingHome({ ctx }: { ctx: OrgContext }) {
  const [products, plan, quota, results] = await Promise.all([
    listProducts(ctx),
    getActivePlan(ctx),
    aiQuota(ctx),
    listResults(ctx, 30),
  ]);
  const t = totals(results);
  const firstName = ctx.user.name.split(/\s+/)[0];
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
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Produits suivis"
          value={`${products.length} / ${ctx.plan.limits.products}`}
          hint={`Forfait ${ctx.plan.name}`}
          icon={<Package />}
        />
        <StatCard
          label="Générations IA ce mois-ci"
          value={`${quota.used} / ${quota.limit}`}
          icon={<Sparkles />}
        />
        <StatCard
          label="Ventes déclarées (30 j)"
          value={t.sales === null ? "—" : String(t.sales)}
          hint={
            results.length ? `Dépense : ${formatCents(t.spendCents)}` : "Saisissez vos résultats"
          }
          icon={<Wallet />}
        />
      </div>
      {plan ? (
        <section className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs" data-testid="home-autopilot">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <Rocket className="size-4 text-primary" />
              {plan.progress.finished
                ? "Autopilot terminé"
                : `Autopilot · jour ${plan.day} / 30`}
            </h2>
            <span className="text-sm text-muted-foreground">
              {plan.progress.done} / {plan.progress.total} actions
            </span>
          </div>
          {plan.progress.finished ? null : (
            <ul className="grid gap-1 text-sm">
              {plan.today.map((task) => (
                <li key={task.id} className={task.doneAt ? "text-muted-foreground line-through" : ""}>
                  {task.title}
                </li>
              ))}
            </ul>
          )}
          <div>
            <Button asChild size="sm">
              <Link href="/tableau-de-bord/autopilot-marketing">Ouvrir l&apos;Autopilot</Link>
            </Button>
          </div>
        </section>
      ) : products.length ? (
        <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <strong>Prochaine étape :</strong> créez une stratégie 30 jours puis lancez
            l&apos;Autopilot.
          </p>
          <Button asChild size="sm">
            <Link href="/tableau-de-bord/strategies">Créer ma stratégie</Link>
          </Button>
        </section>
      ) : null}
      {products.length === 0 ? (
        <div className="rounded-2xl border bg-card p-6 shadow-xs">
          <p className="text-lg font-semibold">Commencez par votre premier produit</p>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Présentez ce que vous vendez : c&apos;est la base de l&apos;analyse, de la stratégie et
            des contenus que BookSync prépare pour vous.
          </p>
          <Button asChild className="mt-4">
            <Link href="/tableau-de-bord/produits/nouveau">
              <Plus /> Ajouter un produit
            </Link>
          </Button>
        </div>
      ) : (
        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Vos produits</h2>
            <Link
              href="/tableau-de-bord/produits"
              className="text-sm font-medium text-primary hover:underline"
            >
              Tout voir <ArrowRight className="inline size-3.5" />
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {products.slice(0, 4).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/tableau-de-bord/produits/${p.id}` as Route}
                  className="block rounded-2xl border bg-card p-4 shadow-xs hover:border-primary/40"
                >
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {categoryLabel(p.category)} ·{" "}
                    {p.priceCents !== null ? formatCents(p.priceCents) : "Prix non indiqué"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
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
