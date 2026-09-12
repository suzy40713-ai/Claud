import { ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ExampleSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <Badge variant="outline" className="mb-4">
            Exemple fictif
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">De la description au plan d'action</h2>
          <p className="mt-3 text-muted-foreground">
            Un exemple illustratif du type de résultat que LaunchPilot peut générer.
          </p>
        </div>

        <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Produit décrit</p>
              <p className="font-semibold">Focusly — app de suivi de temps pour freelances</p>
              <p className="text-sm text-muted-foreground">
                "Une app mobile qui aide les freelances à suivre leur temps facturable sans y penser. Prix : 9€/mois.
                Budget marketing : moins de 100€/mois. Aucune audience existante."
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-white">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          <Card className="border-primary/30">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Résultat LaunchPilot</p>
              <div>
                <p className="text-sm font-medium">Positionnement</p>
                <p className="text-sm text-muted-foreground">
                  "Focusly aide les freelances débordés à facturer chaque minute travaillée, sans jamais y penser."
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Première action recommandée</p>
                <p className="text-sm text-muted-foreground">
                  Publier une vidéo TikTok montrant Focusly en train de suivre une session de travail réelle, hook :
                  "Voici combien d'argent tu perds chaque semaine sans t'en rendre compte."
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Canal d'acquisition prioritaire</p>
                <p className="text-sm text-muted-foreground">
                  TikTok organique — communautés de freelances, coût 0€, potentiel élevé.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
