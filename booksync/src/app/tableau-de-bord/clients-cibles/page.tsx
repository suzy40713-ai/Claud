import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ToolLanding } from "@/components/marketing/tool-landing";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Recherche de clients" };

async function Content({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const ctx = await requirePermission("marketing.manage");
  const { produit } = await searchParams;
  return (
    <ToolLanding
      ctx={ctx}
      kind="customers"
      submitLabel="Trouver mes clients idéaux"
      productId={typeof produit === "string" ? produit : undefined}
    />
  );
}

export default function Page(props: PageProps<"/tableau-de-bord/clients-cibles">) {
  return (
    <>
      <PageHeader
        title="Recherche de clients"
        description="Vos clients idéaux : leurs besoins, leurs problèmes, ce qui les motive et où les trouver."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={props.searchParams as Promise<{ produit?: string }>} />
      </Suspense>
    </>
  );
}
