import Link from "next/link";
import type { Route } from "next";
import { History, Package, Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TOOLS, type ToolKind } from "@/domain/marketing/tools";
import type { OrgContext } from "@/server/auth/session";
import { listProducts } from "@/server/marketing/products";
import { toolHistory } from "@/server/marketing/tools";
import { toolUsage } from "@/server/ai/gateway";
import { originLabel } from "@/server/ai/produce";
import { ToolForm } from "./tool-form";

/** Page d'un outil du copilote : choix, génération, historique. */
export async function ToolLanding({
  ctx,
  kind,
  submitLabel,
  productId,
}: {
  ctx: OrgContext;
  kind: ToolKind;
  submitLabel: string;
  productId?: string;
}) {
  const tool = TOOLS[kind];
  const [products, history, usage] = await Promise.all([
    listProducts(ctx),
    toolHistory(ctx, kind),
    toolUsage(ctx),
  ]);
  const names = new Map(products.map((p) => [p.id, p.name]));
  return (
    <div className="grid gap-6">
      {usage.limit !== null ? <QuotaNote used={usage.used} limit={usage.limit} /> : null}
      {products.length === 0 ? (
        <EmptyState
          icon={<Package />}
          title="Ajoutez d'abord un produit"
          description="Chaque outil part de ce que vous vendez : ajoutez votre produit ou service en deux minutes."
          action={
            <Button asChild>
              <Link href="/tableau-de-bord/produits/nouveau">
                <Plus /> Ajouter un produit
              </Link>
            </Button>
          }
        />
      ) : (
        <ToolForm
          kind={kind}
          products={products.map((p) => ({ id: p.id, name: p.name }))}
          defaultProductId={products.some((p) => p.id === productId) ? productId : undefined}
          submitLabel={submitLabel}
        />
      )}
      {history.length > 0 ? (
        <section className="grid gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <History className="size-4" /> Historique
          </h2>
          <ul className="grid gap-2" data-testid="tool-history">
            {history.map((h) => (
              <li key={h.id}>
                <Link
                  href={`${tool.section}/${h.id}` as Route}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-sm hover:border-primary/40"
                >
                  <span className="font-medium">
                    {(h.productId && names.get(h.productId)) || "Produit supprimé"}
                  </span>
                  <span className="text-muted-foreground">
                    {h.createdAt.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** Propositions restantes ce mois-ci (forfait gratuit). */
export function QuotaNote({ used, limit }: { used: number; limit: number }) {
  return (
    <p
      className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground"
      data-testid="tool-quota"
    >
      {Math.min(used, limit)} / {limit} propositions utilisées ce mois-ci (forfait gratuit).
      <Link href="/tableau-de-bord/abonnement" className="font-medium text-primary hover:underline">
        Illimité avec Starter
      </Link>
    </p>
  );
}

/** Rappel affiché sous chaque résultat : origine (IA gratuite ou modèle) et précautions. */
export function AiDisclaimer({ model }: { model: string }) {
  return (
    <Alert data-testid="result-origin">
      <strong>{originLabel(model)}.</strong> Proposition préparée à partir de vos informations :
      relisez-la et adaptez-la avant de l&apos;utiliser. Les hypothèses doivent être vérifiées et
      aucun résultat (vues, ventes, chiffre d&apos;affaires) n&apos;est garanti.
    </Alert>
  );
}

/** Rappel des choix utilisés pour une génération. */
export function ToolChoices({ choix }: { choix?: Record<string, string | string[]> }) {
  if (!choix) return null;
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
      {Object.entries(choix).map(([k, v]) => (
        <div key={k} className="flex gap-1">
          <dt>{k} :</dt>
          <dd className="font-medium text-foreground">
            {Array.isArray(v) ? v.join(", ") : v.length > 60 ? `${v.slice(0, 60)}…` : v}
          </dd>
        </div>
      ))}
    </dl>
  );
}
