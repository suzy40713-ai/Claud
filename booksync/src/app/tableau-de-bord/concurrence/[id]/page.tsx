import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AiDisclaimer, ToolChoices } from "@/components/marketing/tool-landing";
import { CompetitorsView } from "@/components/marketing/tool-results";
import { requirePermission } from "@/server/auth/session";
import { getProduct } from "@/server/marketing/products";
import { getToolResult } from "@/server/marketing/tools";

export const metadata: Metadata = { title: "Concurrence" };

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePermission("marketing.manage");
  const r = await getToolResult(ctx, "competitors", id);
  if (!r) notFound();
  const product = r.productId ? await getProduct(ctx, r.productId) : null;
  return (
    <div className="grid gap-5">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/tableau-de-bord/concurrence">
            <ArrowLeft /> Concurrence
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight" data-testid="tool-result-title">
          Concurrence · {product?.name ?? "Produit supprimé"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Généré le {r.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <ToolChoices choix={r.input.choix} />
      <AiDisclaimer model={r.model} />
      <CompetitorsView c={r.output} />
      {product ? (
        <div>
          <Button asChild variant="secondary">
            <Link href={`/tableau-de-bord/concurrence?produit=${product.id}` as Route}>Générer une nouvelle version</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function Page(props: PageProps<"/tableau-de-bord/concurrence/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content params={props.params} />
    </Suspense>
  );
}
