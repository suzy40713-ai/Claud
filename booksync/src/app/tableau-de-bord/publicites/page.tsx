import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ToolLanding } from "@/components/marketing/tool-landing";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Publicités" };

async function Content({ searchParams }: { searchParams: Promise<{ produit?: string }> }) {
  const ctx = await requirePermission("marketing.manage");
  const { produit } = await searchParams;
  return (
    <ToolLanding
      ctx={ctx}
      kind="ad"
      submitLabel="Créer mes publicités"
      productId={typeof produit === "string" ? produit : undefined}
    />
  );
}

export default function Page(props: PageProps<"/tableau-de-bord/publicites">) {
  return (
    <>
      <PageHeader
        title="Publicités"
        description="Des publicités prêtes à tester pour TikTok, Instagram, Facebook ou Google Ads, dans le style de votre choix."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content searchParams={props.searchParams as Promise<{ produit?: string }>} />
      </Suspense>
    </>
  );
}
