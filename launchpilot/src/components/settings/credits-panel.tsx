import { Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { BuyCreditButton } from "@/components/billing/buy-credit-button";
import { formatDate } from "@/lib/utils";
import type { Tables } from "@/types/database";

const FEATURES = [
  "Score marketing complet (6 sous-scores détaillés)",
  "Persona, positionnement et offre sur-mesure",
  "30 idées de contenu avec scripts complets",
  "Calendrier d'action complet sur 30 jours",
  "5 emails marketing + 5 concepts publicitaires",
  "Analyse de page produit incluse",
];

export function CreditsPanel({
  creditsBalance,
  purchases,
}: {
  creditsBalance: number;
  purchases: Tables<"credit_purchases">[];
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
        <span className="font-semibold">{creditsBalance}</span> crédit{creditsBalance !== 1 ? "s" : ""} disponible
        {creditsBalance !== 1 ? "s" : ""} — chaque crédit débloque un plan marketing complet.
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-lg font-semibold">Plan marketing complet</p>
            <p className="text-sm text-muted-foreground">Paiement unique, sans abonnement.</p>
          </div>
          <p className="text-3xl font-bold">
            14,99€ <span className="text-base font-normal text-muted-foreground">/ plan</span>
          </p>
          <ul className="space-y-2 text-sm">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                {f}
              </li>
            ))}
          </ul>
          <BuyCreditButton variant="brand" className="w-full" returnTo="/dashboard/parametres?tab=abonnement" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="mb-4 text-sm font-semibold">Historique d'achats</p>
          {purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun achat pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {purchases.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                >
                  <span>{formatDate(p.created_at)}</span>
                  <span className="text-muted-foreground">
                    {p.credits_granted} crédit{p.credits_granted !== 1 ? "s" : ""} ·{" "}
                    {(p.amount_cents / 100).toFixed(2)}€
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
