import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryLabel } from "@/domain/marketing/product";
import { formatCents } from "@/lib/format";
import { requirePermission } from "@/server/auth/session";
import { getProduct } from "@/server/marketing/products";
import { DeleteProductButton } from "./delete-button";
import { AnalyzeButton } from "./analyze-button";
import { Alert } from "@/components/ui/alert";
import { ProductAnalysisView } from "@/components/marketing/product-analysis";
import { aiQuota, isAiConfigured } from "@/server/ai/gateway";
import { latestAnalysis } from "@/server/marketing/analysis";

export const metadata: Metadata = { title: "Produit" };

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePermission("marketing.manage");
  const p = await getProduct(ctx, id);
  if (!p) notFound();
  const [latest, quota] = await Promise.all([latestAnalysis(ctx, p.id), aiQuota(ctx)]);
  const configured = isAiConfigured();
  const rows: Array<[string, string | null]> = [
    ["Description", p.description],
    ["Avantages", p.benefits],
    ["Public cible", p.targetAudience],
  ];
  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="product-name">
            {p.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="neutral">{categoryLabel(p.category)}</Badge>
            {p.priceCents !== null ? formatCents(p.priceCents) : "Prix non indiqué"}
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Voir la page <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href={`/tableau-de-bord/produits/${p.id}/modifier` as Route}>
              <Pencil /> Modifier
            </Link>
          </Button>
          <DeleteProductButton id={p.id} name={p.name} />
        </div>
      </div>
      <dl className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {k}
            </dt>
            <dd className="mt-1 text-[15px] whitespace-pre-line">{v ?? "Non renseigné"}</dd>
          </div>
        ))}
      </dl>
      <section className="grid gap-4" aria-labelledby="analyse-titre">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="analyse-titre" className="text-lg font-semibold">
              Analyse IA
            </h2>
            <p className="text-sm text-muted-foreground" data-testid="ai-quota">
              {quota.used} / {quota.limit} générations IA utilisées ce mois-ci
              {latest
                ? ` · dernière analyse le ${latest.createdAt.toLocaleDateString("fr-FR")}`
                : ""}
            </p>
          </div>
          {configured ? <AnalyzeButton id={p.id} again={Boolean(latest)} /> : null}
        </div>
        {!configured ? (
          <Alert data-testid="ai-not-configured">
            Les fonctions IA ne sont pas encore activées sur BookSync. Elles arrivent très
            bientôt : vos produits sont déjà prêts à être analysés.
          </Alert>
        ) : null}
        <Alert>
          L&apos;analyse s&apos;appuie uniquement sur les informations ci-dessus. Les points
          marqués « Hypothèse à vérifier » ne sont pas des données de marché : testez-les
          auprès de vrais clients. Aucun résultat de vente n&apos;est garanti.
        </Alert>
        {latest ? (
          <ProductAnalysisView analysis={latest.analysis} />
        ) : configured ? (
          <p className="text-sm text-muted-foreground">
            Pas encore d&apos;analyse. Plus votre description est précise, plus l&apos;analyse
            sera utile.
          </p>
        ) : null}
      </section>
    </div>
  );
}

export default function ProductPage(props: PageProps<"/tableau-de-bord/produits/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content params={props.params} />
    </Suspense>
  );
}
