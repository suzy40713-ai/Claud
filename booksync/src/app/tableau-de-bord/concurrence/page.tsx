import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ToolLanding } from "@/components/marketing/tool-landing";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Concurrence" };

async function Content({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const ctx = await requirePermission("marketing.manage");
  const { produit } = await searchParams;
  return (
    <ToolLanding
      ctx={ctx}
      kind="competitors"
      submitLabel="Analyser la concurrence"
      productId={typeof produit === "string" ? produit : undefined}
    />
  );
}

export default function Page(props: PageProps<"/tableau-de-bord/concurrence">) {
  return (
    <>
      <PageHeader
        title="Concurrence"
        description="Ajoutez le site de vos concurrents : positionnement, offres, prix publics et comment vous différencier."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={props.searchParams as Promise<{ produit?: string }>} />
      </Suspense>
    </>
  );
}
