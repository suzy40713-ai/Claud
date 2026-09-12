import Link from "next/link";
import { Package, Plus } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductEditForm } from "@/components/product/product-edit-form";
import { PageAnalysisPanel } from "@/components/product/page-analysis-panel";
import { createClient } from "@/lib/supabase/server";
import { getCreditStatus } from "@/lib/credits";
import { getPlan } from "@/lib/config/plans";

export default async function ProductPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!products || products.length === 0) {
    return (
      <div>
        <PageHeader title="Mon produit" description="Les informations utilisées pour générer ton plan." />
        <EmptyState
          icon={Package}
          title="Aucun produit enregistré"
          description="Ajoute ton produit pour recevoir ton plan marketing personnalisé."
          actionLabel="Ajouter mon produit"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  const activeProduct = products[0];

  const [{ data: latestAnalysis }, credits] = await Promise.all([
    supabase
      .from("product_page_analyses")
      .select("*")
      .eq("product_id", activeProduct.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getCreditStatus(user.id),
  ]);

  const plan = getPlan(credits.plan);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon produit"
        description="Les informations utilisées pour générer ton plan marketing."
        actions={
          <Button asChild variant="outline">
            <Link href="/onboarding">
              <Plus className="h-4 w-4" />
              Ajouter un produit
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductEditForm product={activeProduct} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analyse de ta page produit</CardTitle>
        </CardHeader>
        <CardContent>
          <PageAnalysisPanel
            product={activeProduct}
            latestAnalysis={latestAnalysis ?? null}
            canAnalyze={plan.limits.advancedAnalysis}
          />
        </CardContent>
      </Card>

      {products.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Autres produits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {products.slice(1).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground">{p.category}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
