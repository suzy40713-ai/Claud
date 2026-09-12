import Link from "next/link";
import { ArrowRight, PlayCircle, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-grid-fade">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px] bg-gradient-to-b from-primary/10 via-transparent to-transparent" />
      <div className="container flex flex-col items-center gap-14 py-20 text-center sm:py-28 lg:flex-row lg:items-center lg:gap-16 lg:text-left">
        <div className="flex-1 space-y-6 animate-in-fade">
          <Badge variant="outline" className="gap-1.5">
            <TrendingUp className="h-3 w-3" />
            Nouveau : plans marketing générés par IA
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Lance ton produit.
            <br />
            <span className="text-gradient-brand">Trouve tes premiers clients.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground lg:mx-0">
            LaunchPilot transforme ton produit en stratégie marketing personnalisée, contenu prêt à publier et plan
            d'action sur 30 jours.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Button asChild size="lg" variant="brand">
              <Link href="/signup">
                Créer mon plan gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#comment-ca-marche">
                <PlayCircle className="h-4 w-4" />
                Voir comment ça marche
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Aucune carte bancaire requise pour commencer.</p>
        </div>

        <div className="w-full flex-1 animate-in-fade">
          <Card className="mx-auto max-w-md shadow-xl">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Marketing Readiness Score</p>
                <Badge variant="warning">74/100</Badge>
              </div>
              <Progress value={74} />
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { label: "Positionnement", score: 68 },
                  { label: "Offre", score: 80 },
                  { label: "Acquisition", score: 55 },
                  { label: "Contenu", score: 72 },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-semibold">{s.score}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-secondary/60 p-3 text-left text-xs text-muted-foreground">
                "Publie 4 vidéos TikTok cette semaine ciblant les freelances débordés. Commence par : 'Tu fais
                probablement cette erreur...'"
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
