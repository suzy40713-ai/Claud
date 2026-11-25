import Link from "next/link";
import type { Route } from "next";
import { formatCents } from "@/lib/format";
import type { OrgContext } from "@/server/auth/session";
import { generationCountsByKind, listGenerations } from "@/server/ai/gateway";
import { originLabel } from "@/server/ai/produce";
import { listProducts } from "@/server/marketing/products";
import { weeklyResults } from "@/server/marketing/results";

const KINDS: Record<string, { label: string; section: string }> = {
  product_analysis: { label: "Analyse", section: "/tableau-de-bord/produits" },
  customers: { label: "Clients idéaux", section: "/tableau-de-bord/clients-cibles" },
  competitors: { label: "Concurrence", section: "/tableau-de-bord/concurrence" },
  strategy: { label: "Stratégie", section: "/tableau-de-bord/strategies" },
  ad: { label: "Publicités", section: "/tableau-de-bord/publicites" },
  content: { label: "Contenus", section: "/tableau-de-bord/contenus" },
  sales: { label: "Optimisation des ventes", section: "/tableau-de-bord/sales-booster" },
};

/** Compteurs, graphique (si données réelles) et historique : rien n'est estimé ni inventé. */
export async function ActivityPanel({ ctx }: { ctx: OrgContext }) {
  const [counts, history, weekly, products] = await Promise.all([
    generationCountsByKind(ctx),
    listGenerations(ctx, { limit: 8 }),
    weeklyResults(ctx),
    listProducts(ctx),
  ]);
  const names = new Map(products.map((p) => [p.id, p.name]));
  const max = Math.max(1, ...weekly.weeks.map((w) => w.revenueCents));
  return (
    <div className="grid gap-6" data-testid="activity">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="activity-counts">
        {(
          [
            ["Produits", products.length],
            ["Stratégies", counts.strategy ?? 0],
            ["Publicités", counts.ad ?? 0],
            ["Contenus", counts.content ?? 0],
          ] as const
        ).map(([label, n]) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-xs">
            <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{n}</p>
          </div>
        ))}
      </section>

      {weekly.hasData ? (
        <section className="rounded-2xl border bg-card p-5 shadow-xs" data-testid="weekly-chart">
          <h2 className="font-semibold">Chiffre d&apos;affaires déclaré, par semaine</h2>
          <ol
            className="mt-4 flex h-36 items-end gap-2"
            aria-label="Chiffre d'affaires par semaine"
          >
            {weekly.weeks.map((w) => (
              <li
                key={w.start}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {w.revenueCents ? formatCents(w.revenueCents) : ""}
                </span>
                <span
                  className="w-full rounded-t-md bg-primary/80"
                  style={{ height: `${Math.max(2, (w.revenueCents / max) * 100)}%` }}
                  title={`Semaine du ${new Date(`${w.start}T12:00:00Z`).toLocaleDateString("fr-FR")} : ${formatCents(w.revenueCents)}, ${w.sales} vente(s)`}
                />
                <span className="text-[11px] text-muted-foreground">
                  {new Date(`${w.start}T12:00:00Z`).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            Uniquement les résultats que vous avez saisis.
          </p>
        </section>
      ) : null}

      {history.length ? (
        <section className="grid gap-2">
          <h2 className="font-semibold">Activité récente</h2>
          <ul className="grid gap-2" data-testid="activity-history">
            {history.map((h) => {
              const k = KINDS[h.kind];
              if (!k) return null;
              const href =
                h.kind === "product_analysis" && h.productId
                  ? `/tableau-de-bord/produits/${h.productId}`
                  : `${k.section}/${h.id}`;
              return (
                <li key={h.id}>
                  <Link
                    href={href as Route}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-2.5 text-sm hover:border-primary/40"
                  >
                    <span>
                      <span className="font-medium">{k.label}</span>
                      {h.productId && names.get(h.productId) ? ` · ${names.get(h.productId)}` : ""}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {h.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}{" "}
                      · {originLabel(h.model).startsWith("Rédigé") ? "IA" : "Modèle"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
