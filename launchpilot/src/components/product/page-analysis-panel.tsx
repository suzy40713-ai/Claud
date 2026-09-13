"use client";

import * as React from "react";
import { AlertTriangle, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { analyzeProductUrl } from "@/lib/actions/page-analysis";
import type { Tables } from "@/types/database";

export function PageAnalysisPanel({
  product,
  latestAnalysis,
}: {
  product: Tables<"products">;
  latestAnalysis: Tables<"product_page_analyses"> | null;
}) {
  const [loading, setLoading] = React.useState(false);
  const analysis = latestAnalysis;

  async function runAnalysis() {
    setLoading(true);
    const result = await analyzeProductUrl(product.id);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error || "L'analyse a échoué.");
      return;
    }
    toast.success("Analyse terminée.");
    // The server action revalidates this page — a full refresh isn't
    // needed, but we optimistically flag that an analysis just completed.
    window.location.reload();
  }

  if (!product.url) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Ajoute une URL à ton produit ci-dessus pour pouvoir analyser sa page publiquement.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Analyse les informations publiques de {product.url}</p>
        <Button onClick={runAnalysis} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {analysis ? "Relancer l'analyse" : "Analyser ma page"}
        </Button>
      </div>

      {analysis && analysis.fetch_status !== "ok" && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="flex items-start gap-2 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            Impossible d'analyser cette page automatiquement (accès public non disponible). Vérifie que l'URL est
            correcte et publiquement accessible.
          </CardContent>
        </Card>
      )}

      {analysis && analysis.fetch_status === "ok" && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Titre détecté" value={analysis.page_title || "Non trouvé"} />
              <InfoRow label="Meta description" value={analysis.meta_description || "Non trouvée"} />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">10 améliorations prioritaires</p>
              <ol className="space-y-2">
                {(analysis.improvements as string[]).map((imp, i) => (
                  <li key={i} className="flex gap-3 rounded-lg border border-border p-3 text-sm">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {i + 1}
                    </span>
                    {imp}
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}
