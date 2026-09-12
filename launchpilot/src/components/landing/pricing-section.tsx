import Link from "next/link";
import { Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/config/plans";

export function PricingSection() {
  return (
    <section id="tarifs" className="bg-secondary/30 py-20 sm:py-28">
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Un tarif simple</h2>
          <p className="mt-3 text-muted-foreground">Commence gratuitement, passe en Pro quand tu es prêt à accélérer.</p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          <Card>
            <CardContent className="space-y-5 p-8">
              <div>
                <p className="text-lg font-semibold">{PLANS.free.name}</p>
                <p className="text-sm text-muted-foreground">{PLANS.free.description}</p>
              </div>
              <p className="text-4xl font-bold">0€</p>
              <ul className="space-y-2.5 text-sm">
                {PLANS.free.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Commencer gratuitement</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="relative border-primary shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-3 py-1 text-xs font-medium text-white">
              Recommandé
            </div>
            <CardContent className="space-y-5 p-8">
              <div>
                <p className="text-lg font-semibold">{PLANS.pro.name}</p>
                <p className="text-sm text-muted-foreground">{PLANS.pro.description}</p>
              </div>
              <p className="text-4xl font-bold">
                {PLANS.pro.priceMonthly}€<span className="text-base font-normal text-muted-foreground">/mois</span>
              </p>
              <ul className="space-y-2.5 text-sm">
                {PLANS.pro.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild variant="brand" className="w-full">
                <Link href="/signup">Créer mon plan gratuitement</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
