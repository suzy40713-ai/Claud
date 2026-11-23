import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ToolLanding } from "@/components/marketing/tool-landing";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Sales Booster" };

async function Content({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const ctx = await requirePermission("marketing.manage");
  const { produit } = await searchParams;
  return (
    <ToolLanding
      ctx={ctx}
      kind="sales"
      submitLabel="Analyser ma page de vente"
      productId={typeof produit === "string" ? produit : undefined}
    />
  );
}

export default function Page(props: PageProps<"/tableau-de-bord/sales-booster">) {
  return (
    <>
      <PageHeader
        title="Sales Booster"
        description="Des améliorations concrètes pour transformer plus de visiteurs en acheteurs : textes, tests A/B, confiance."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={props.searchParams as Promise<{ produit?: string }>} />
      </Suspense>
    </>
  );
}
