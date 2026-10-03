import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { FEATURES, FinalCta, HowItWorks, Transparency } from "@/components/marketing/sections";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Fonctionnalités",
  description:
    "Ad Library multi-sources, analyse IA des publicités, générateur de publicités, radar de tendances, collections et travail en équipe : découvre la plateforme AdHunter.",
  alternates: { canonical: "/fonctionnalites" },
};

const DETAILS: Record<string, string[]> = {
  "Ad Library multi-sources": [
    "Filtres : niche, plateforme, pays, langue, format, mot-clé et période de diffusion",
    "Texte publicitaire, annonceur, plateformes et dates de diffusion",
    "Lien direct vers la publicité dans la bibliothèque officielle",
    "Enregistrement en un clic dans tes favoris ou collections",
  ],
  "AI Ad Analyzer": [
    "Analyse de l'accroche et du public cible probable",
    "Problème traité, techniques marketing, forces et faiblesses",
    "3 idées de publicités originales inspirées des principes observés",
    "Recommandations concrètes pour améliorer tes propres annonces",
  ],
  "Ad Creator": [
    "5 accroches, 3 textes publicitaires, 3 appels à l'action",
    "3 concepts de vidéos courtes et des suggestions de visuels",
    "Variantes adaptées à TikTok, Instagram et Facebook",
    "Copie, modification et sauvegarde de chaque création",
  ],
  "Trend Radar": [
    "Niches les plus recherchées dans les données AdHunter",
    "Mots-clés et formats publicitaires observés",
    "Évolution semaine par semaine",
    "Pistes de campagnes associées, avec la taille d'échantillon",
  ],
  "Favoris et collections": ["Notes personnelles", "Organisation par niche", "Synchronisation avec ton compte"],
  "Travail en équipe": ["Collections partagées", "Jusqu'à 10 membres", "Exports CSV et JSON"],
};

export default function FeaturesPage() {
  return (
    <>
      <section className="container pb-16 pt-20 text-center">
        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold sm:text-5xl">Découvre la plateforme AdHunter</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          De la veille concurrentielle à la création de campagnes : un seul outil, pensé pour les e-commerçants, dropshippers et agences.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild variant="brand" size="lg">
            <Link href="/signup">Commencer gratuitement <ArrowRight /></Link>
          </Button>
        </div>
        <div className="mt-16"><DashboardPreview /></div>
      </section>
      <section className="container space-y-6 pb-24">
        {FEATURES.map((f, i) => (
          <article key={f.title} className="surface grid gap-8 p-8 md:grid-cols-2 md:p-10">
            <div className={i % 2 ? "md:order-2" : ""}>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-violet-400">
                <f.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold">{f.title}</h2>
              <p className="mt-3 text-muted-foreground">{f.description}</p>
            </div>
            <ul className="space-y-3 self-center">
              {(DETAILS[f.title] ?? []).map((d) => (
                <li key={d} className="rounded-lg border border-border bg-background/40 px-4 py-3 text-sm">{d}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
      <HowItWorks />
      <Transparency />
      <FinalCta />
    </>
  );
}
