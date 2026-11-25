import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AiDisclaimer, ToolChoices } from "@/components/marketing/tool-landing";
import { SalesView } from "@/components/marketing/tool-results";
import { requirePermission } from "@/server/auth/session";
import { getProduct } from "@/server/marketing/products";
import { getToolResult } from "@/server/marketing/tools";
import { getActivePlan } from "@/server/marketing/autopilot";

export const metadata: Metadata = { title: "Optimisation des ventes" };

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requirePermission("marketing.manage");
  const r = await getToolResult(ctx, "sales", id);
  if (!r) notFound();
  const product = r.productId ? await getProduct(ctx, r.productId) : null;
  return (
    <div className="grid gap-5">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/tableau-de-bord/sales-booster">
            <ArrowLeft /> Optimisation des ventes
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight" data-testid="tool-result-title">
          Optimisation des ventes · {product?.name ?? "Produit supprimé"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Généré le {r.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
      <ToolChoices choix={r.input.choix} />
      <AiDisclaimer model={r.model} />
      <SalesView s={r.output} canPlan={Boolean(await getActivePlan(ctx))} />
      {product ? (
        <div>
          <Button asChild variant="secondary">
            <Link href={`/tableau-de-bord/sales-booster?produit=${product.id}` as Route}>Générer une nouvelle version</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function Page(props: PageProps<"/tableau-de-bord/sales-booster/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content params={props.params} />
    </Suspense>
  );
}
