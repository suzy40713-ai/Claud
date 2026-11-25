import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ToolLanding } from "@/components/marketing/tool-landing";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Stratégies marketing" };

async function Content({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const ctx = await requirePermission("marketing.manage");
  const { produit } = await searchParams;
  return (
    <ToolLanding
      ctx={ctx}
      kind="strategy"
      submitLabel="Créer ma stratégie 30 jours"
      productId={typeof produit === "string" ? produit : undefined}
    />
  );
}

export default function Page(props: PageProps<"/tableau-de-bord/strategies">) {
  return (
    <>
      <PageHeader
        title="Stratégies marketing"
        description="Une stratégie marketing réaliste sur 30 jours, avec 3 actions par jour adaptées à votre temps et à votre budget."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={props.searchParams as Promise<{ produit?: string }>} />
      </Suspense>
    </>
  );
}
