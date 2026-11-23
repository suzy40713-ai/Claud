import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryLabel } from "@/domain/marketing/product";
import { formatCents } from "@/lib/format";
import { requirePermission } from "@/server/auth/session";
import { listProducts } from "@/server/marketing/products";

export const metadata: Metadata = { title: "Mes produits" };

async function Content() {
  const ctx = await requirePermission("marketing.manage");
  const products = await listProducts(ctx);
  const limit = ctx.plan.limits.products;
  const full = products.length >= limit;
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {products.length} / {limit} produit{limit > 1 ? "s" : ""} · forfait {ctx.plan.name}
        </p>
        {full ? (
          <Button asChild variant="secondary">
            <Link href="/tableau-de-bord/abonnement">Passer à un forfait supérieur</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/tableau-de-bord/produits/nouveau">
              <Plus /> Ajouter un produit
            </Link>
          </Button>
        )}
      </div>
      {products.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="Ajoutez votre premier produit"
          description="Un produit physique, numérique, un service ou une formation : c'est le point de départ de l'analyse et de votre stratégie marketing."
          action={
            <Button asChild>
              <Link href="/tableau-de-bord/produits/nouveau">
                <Plus /> Ajouter un produit
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" data-testid="product-list">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/tableau-de-bord/produits/${p.id}` as Route}
                className="block h-full rounded-2xl border bg-card p-5 shadow-xs transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{p.name}</p>
                  <Badge variant="neutral">{categoryLabel(p.category)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.priceCents !== null ? formatCents(p.priceCents) : "Prix non indiqué"}
                </p>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Mes produits"
        description="Les produits et services que BookSync vous aide à vendre."
      />
      <Suspense fallback={<Skeleton className="h-64" />}>
        <Content />
      </Suspense>
    </>
  );
}
