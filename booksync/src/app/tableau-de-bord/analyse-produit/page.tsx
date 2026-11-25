import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Package, Plus, ScanSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/server/auth/session";
import { listGenerations } from "@/server/ai/gateway";
import { ANALYSIS_KIND } from "@/server/marketing/analysis";
import { listProducts } from "@/server/marketing/products";

export const metadata: Metadata = { title: "Analyse IA" };

async function Content() {
  const ctx = await requirePermission("marketing.manage");
  const [products, history] = await Promise.all([
    listProducts(ctx),
    listGenerations(ctx, { kind: ANALYSIS_KIND, limit: 200 }),
  ]);
  const lastByProduct = new Map<string, Date>();
  for (const h of history)
    if (h.productId && !lastByProduct.has(h.productId)) lastByProduct.set(h.productId, h.createdAt);

  return (
    <div className="grid gap-4">
      {products.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="Ajoutez d'abord un produit"
          description="L'analyse part de ce que vous vendez : description, prix, avantages et public visé."
          action={
            <Button asChild>
              <Link href="/tableau-de-bord/produits/nouveau">
                <Plus /> Ajouter un produit
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" data-testid="analysis-products">
          {products.map((p) => {
            const last = lastByProduct.get(p.id);
            return (
              <li key={p.id}>
                <Link
                  href={`/tableau-de-bord/produits/${p.id}#analyse-titre` as Route}
                  className="flex h-full items-start justify-between gap-3 rounded-2xl border bg-card p-5 shadow-xs transition-colors hover:border-primary/40"
                >
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {last
                        ? `Analysé le ${last.toLocaleDateString("fr-FR")}`
                        : "Pas encore analysé"}
                    </p>
                  </div>
                  {last ? (
                    <Badge variant="success">Analysé</Badge>
                  ) : (
                    <Badge variant="neutral">
                      <ScanSearch className="size-3" /> À analyser
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <>
      <PageHeader
        title="Analyse IA"
        description="Points forts, acheteurs possibles, angles de vente et premières actions pour chacun de vos produits."
      />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Content />
      </Suspense>
    </>
  );
}
