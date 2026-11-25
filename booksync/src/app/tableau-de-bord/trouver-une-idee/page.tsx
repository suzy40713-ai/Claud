import type { Metadata } from "next";
import { Suspense } from "react";
import { IdeaPicker } from "@/components/launch/idea-picker";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = { title: "Trouver une idée" };

async function Gate({ searchParams }: { searchParams: Promise<{ idee?: string }> }) {
  await requirePermission("marketing.manage");
  const { idee } = await searchParams;
  return <IdeaPicker mode="dashboard" initialIdeaId={typeof idee === "string" ? idee : undefined} />;
}

export default function FindIdeaPage(props: PageProps<"/tableau-de-bord/trouver-une-idee">) {
  return (
    <>
      <PageHeader
        title="Trouver une idée"
        description="Pas besoin de diplôme ni d'argent de départ : choisis ce que tu sais faire, BookSync te propose quoi vendre, à quel prix et à qui."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Gate searchParams={props.searchParams as Promise<{ idee?: string }>} />
      </Suspense>
    </>
  );
}
