import {
  Target,
  Users,
  Compass,
  Package,
  Lightbulb,
  Video,
  CalendarDays,
  Megaphone,
  Mail,
  ListChecks,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const ITEMS = [
  { icon: TrendingUp, title: "Stratégie marketing", description: "Un plan complet et priorisé, pas une liste de conseils génériques." },
  { icon: Users, title: "Client idéal", description: "Un persona détaillé basé sur les informations de ton produit." },
  { icon: Compass, title: "Positionnement", description: "Proposition de valeur, différenciation et elevator pitch." },
  { icon: Package, title: "Offre", description: "Comment structurer ton offre pour convertir davantage." },
  { icon: Lightbulb, title: "Idées de contenu", description: "30 idées concrètes, prêtes à décliner par plateforme." },
  { icon: Video, title: "Scripts TikTok / Reels / Shorts", description: "Des scripts exploitables, pas juste des sujets." },
  { icon: CalendarDays, title: "Calendrier de contenu", description: "Un plan d'action jour par jour sur 30 jours." },
  { icon: Target, title: "Acquisition gratuite", description: "Des stratégies adaptées à ton budget, du gratuit au payant." },
  { icon: Megaphone, title: "Idées publicitaires", description: "5 concepts de publicité prêts à tester." },
  { icon: Mail, title: "Emails", description: "Une séquence email complète, du lancement à la fidélisation." },
  { icon: ListChecks, title: "Plan d'action quotidien", description: "Des actions concrètes, aujourd'hui, cette semaine, ce mois." },
];

export function WhatWeGenerate() {
  return (
    <section id="generation" className="bg-secondary/30 py-20 sm:py-28">
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ce que LaunchPilot génère</h2>
          <p className="mt-3 text-muted-foreground">
            Un plan complet, personnalisé à ton produit — pas des conseils génériques.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <Card key={item.title} className="card-hover">
              <CardContent className="space-y-3 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
