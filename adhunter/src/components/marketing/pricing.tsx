import Link from "next/link";

import { PlanCard } from "@/components/billing/plan-card";
import { SectionHeading } from "@/components/marketing/sections";
import { Button } from "@/components/ui/button";
import { DEFAULT_PLANS, PLAN_ORDER, type PlanDefinition } from "@/lib/plans";
import type { PlanId } from "@/types/database";

export function Pricing({ plans = DEFAULT_PLANS, heading = true }: { plans?: Record<PlanId, PlanDefinition>; heading?: boolean }) {
  return (
    <section id="tarifs" className="container scroll-mt-24 py-24">
      {heading && (
        <SectionHeading
          eyebrow="Tarifs"
          title="Une formule pour chaque étape"
          description="Commence gratuitement. Passe à la vitesse supérieure quand tu en as besoin. Sans engagement, résiliable à tout moment."
        />
      )}
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => (
          <PlanCard
            key={id}
            plan={plans[id]}
            highlighted={id === "pro"}
            action={
              <Button asChild className="w-full" variant={id === "pro" ? "brand" : "outline"}>
                <Link href={id === "free" ? "/signup" : `/signup?plan=${id}`}>
                  {id === "free" ? "Commencer gratuitement" : `Choisir ${plans[id].name}`}
                </Link>
              </Button>
            }
          />
        ))}
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Prix TTC, facturés mensuellement via Stripe. Quotas réinitialisés le 1er de chaque mois.
      </p>
    </section>
  );
}
