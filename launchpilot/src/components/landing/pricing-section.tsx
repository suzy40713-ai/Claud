import Link from "next/link";
import { Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FEATURES = [
  "Score marketing complet (6 sous-scores détaillés)",
  "Persona, positionnement et offre sur-mesure",
  "Stratégies d'acquisition adaptées à ton budget",
  "30 idées de contenu avec scripts complets",
  "Calendrier d'action complet sur 30 jours",
  "5 emails marketing + 5 concepts publicitaires",
  "Analyse de ta page produit incluse",
];

export function PricingSection() {
  return (
    <section id="tarifs" className="bg-secondary/30 py-20 sm:py-28">
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Un tarif simple</h2>
          <p className="mt-3 text-muted-foreground">
            Pas d'abonnement. Tu paies uniquement quand tu génères un plan.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <Card className="relative border-primary shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-1 text-xs font-medium text-white">
              Paiement unique
            </div>
            <CardContent className="space-y-5 p-8">
              <div>
                <p className="text-lg font-semibold">Plan marketing complet</p>
                <p className="text-sm text-muted-foreground">Un produit, un plan, un prix — sans engagement.</p>
              </div>
              <p className="text-4xl font-bold">
                14,99€ <span className="text-base font-normal text-muted-foreground">/ plan</span>
              </p>
              <ul className="space-y-2.5 text-sm">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="brand" className="w-full">
                <Link href="/signup">Créer mon plan</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
