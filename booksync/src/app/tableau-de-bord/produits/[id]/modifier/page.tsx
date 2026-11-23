import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/server/auth/session";
import { getProduct } from "@/server/marketing/products";
import { ProductForm } from "../../product-form";

export const metadata: Metadata = { title: "Modifier le produit" };

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePermission("marketing.manage");
  const p = await getProduct(ctx, id);
  if (!p) notFound();
  return (
    <div className="max-w-2xl rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
      <ProductForm
        productId={p.id}
        submitLabel="Enregistrer"
        initial={{
          name: p.name,
          description: p.description,
          price: p.priceCents !== null ? String(p.priceCents / 100).replace(".", ",") : "",
          category: p.category,
          benefits: p.benefits ?? "",
          targetAudience: p.targetAudience ?? "",
          url: p.url ?? "",
        }}
      />
    </div>
  );
}

export default function EditProductPage(
  props: PageProps<"/tableau-de-bord/produits/[id]/modifier">,
) {
  return (
    <>
      <PageHeader title="Modifier le produit" />
      <Suspense fallback={<Skeleton className="h-[640px]" />}>
        <Content params={props.params} />
      </Suspense>
    </>
  );
}
