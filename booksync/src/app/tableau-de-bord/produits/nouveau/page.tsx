import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/server/auth/session";
import { countProducts } from "@/server/marketing/products";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Ajouter un produit" };

async function Content({ searchParams }: { searchParams: Promise<{ premier?: string }> }) {
  const ctx = await requirePermission("marketing.manage");
  const [n, sp] = await Promise.all([countProducts(ctx.organization.id), searchParams]);
  if (n >= ctx.plan.limits.products) {
    return (
      <Alert>
        Votre forfait {ctx.plan.name} permet {ctx.plan.limits.products} produit
        {ctx.plan.limits.products > 1 ? "s" : ""}.{" "}
        <Button asChild variant="link" className="h-auto p-0">
          <Link href="/tableau-de-bord/abonnement">Voir les forfaits</Link>
        </Button>
      </Alert>
    );
  }
  return (
    <div className="max-w-2xl rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
      {sp.premier ? (
        <p className="mb-5 rounded-xl bg-primary-soft p-4 text-sm text-primary-soft-foreground">
          Dernière étape : présentez ce que vous vendez. BookSync s&apos;en sert pour analyser votre
          produit et construire votre stratégie.
        </p>
      ) : null}
      <ProductForm submitLabel="Ajouter le produit" />
    </div>
  );
}

export default function NewProductPage(props: PageProps<"/tableau-de-bord/produits/nouveau">) {
  return (
    <>
      <PageHeader
        title="Ajouter un produit"
        description="Produit physique, numérique, service ou formation."
      />
      <Suspense fallback={<Skeleton className="h-[640px]" />}>
        <Content searchParams={props.searchParams as Promise<{ premier?: string }>} />
      </Suspense>
    </>
  );
}
