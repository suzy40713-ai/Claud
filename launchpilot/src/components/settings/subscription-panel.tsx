"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { startProUpgrade, openBillingPortal } from "@/lib/actions/billing";
import { PLANS, type PlanId } from "@/lib/config/plans";

export function SubscriptionPanel({
  currentPlan,
  creditsRemaining,
  creditsLimit,
}: {
  currentPlan: PlanId;
  creditsRemaining: number;
  creditsLimit: number;
}) {
  const [loading, setLoading] = React.useState<PlanId | null>(null);

  async function handleUpgrade() {
    setLoading("pro");
    const result = await startProUpgrade();
    setLoading(null);

    if (!result.success) {
      toast.error(result.error || "Une erreur est survenue.");
      return;
    }
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    if (result.devMode) {
      toast.success("Mode développement : ton compte est passé en Pro (Stripe n'est pas encore configuré).");
      window.location.reload();
    }
  }

  async function handleManage() {
    setLoading("free");
    const result = await openBillingPortal();
    setLoading(null);

    if (!result.success) {
      toast.error(result.error || "Une erreur est survenue.");
      return;
    }
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    if (result.devMode) {
      toast.success("Mode développement : ton compte est repassé en Free.");
      window.location.reload();
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
        Forfait actuel : <span className="font-semibold capitalize">{currentPlan}</span> · {creditsRemaining}/
        {creditsLimit} plans restants ce mois-ci
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(["free", "pro"] as PlanId[]).map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = currentPlan === planId;
          return (
            <Card key={planId} className={isCurrent ? "border-primary" : undefined}>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">{plan.name}</p>
                  {isCurrent && <Badge>Actuel</Badge>}
                </div>
                <p className="text-2xl font-bold">
                  {plan.priceMonthly === 0 ? "Gratuit" : `${plan.priceMonthly}€`}
                  {plan.priceMonthly > 0 && <span className="text-sm font-normal text-muted-foreground">/mois</span>}
                </p>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                {planId === "pro" && !isCurrent && (
                  <Button variant="brand" className="w-full" onClick={handleUpgrade} disabled={loading !== null}>
                    {loading === "pro" && <Loader2 className="h-4 w-4 animate-spin" />}
                    Passer en Pro
                  </Button>
                )}
                {planId === "free" && isCurrent === false && currentPlan === "pro" && (
                  <Button variant="outline" className="w-full" onClick={handleManage} disabled={loading !== null}>
                    {loading === "free" && <Loader2 className="h-4 w-4 animate-spin" />}
                    Gérer / annuler mon abonnement
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
