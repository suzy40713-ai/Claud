import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Check,
  MessageCircle,
  Search,
  Users,
  Compass,
  GraduationCap,
  Lightbulb,
  LineChart,
  Megaphone,
  PenLine,
  Rocket,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { CopilotPreview } from "@/components/marketing/copilot-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { ACADEMY } from "@/domain/academy/lessons";
import { PLAN_ORDER, PLANS, formatPrice } from "@/domain/billing/plans";
import { TALENTS } from "@/domain/launch/ideas";
import { site } from "@/lib/site";
import { isAiAvailable } from "@/server/ai/engine";

const SEO_DESCRIPTION =
  "BookSync transforme votre produit en stratégie marketing complète grâce à l'intelligence artificielle : analyse, clients cibles, concurrence, publicités, contenus et plan d'action sur 30 jours. Gratuit pour commencer.";

export const metadata: Metadata = {
  title: { absolute: `${site.name} — ${site.tagline}` },
  description: SEO_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: SEO_DESCRIPTION,
    url: "/",
  },
};

/** Données structurées : BookSync est un logiciel en ligne, avec ses forfaits. */
const SOFTWARE_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: site.name,
  url: site.url,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  inLanguage: "fr-FR",
  description: SEO_DESCRIPTION,
  offers: PLAN_ORDER.map((id) => ({
    "@type": "Offer",
    name: PLANS[id].name,
    price: (PLANS[id].priceCents / 100).toFixed(2),
    priceCurrency: "EUR",
  })),
};

const IDEA_COUNT = TALENTS.flatMap((t) => t.ideas).length;

const STEPS = [
  {
    icon: Lightbulb,
    title: "Ajoutez votre produit",
    text: `Nom, description, prix, avantages, public visé. Pas encore d'idée ? BookSync vous en propose une parmi ${IDEA_COUNT}.`,
  },
  {
    icon: Target,
    title: "Recevez l'analyse",
    text: "Points forts, points faibles, positionnement, clients idéaux et concurrence : tout ce qu'il faut savoir avant de vendre.",
  },
  {
    icon: Compass,
    title: "Obtenez votre stratégie",
    text: "Une stratégie sur 30 jours, des publicités et des contenus prêts à utiliser, adaptés à votre budget.",
  },
  {
    icon: Wand2,
    title: "Suivez votre plan d'action",
    text: "Chaque jour, 3 actions concrètes à cocher. Notez vos ventes et suivez la rentabilité de votre abonnement.",
  },
] as const;

const TOOLS = [
  {
    icon: Target,
    title: "Analyse IA",
    text: "Présentation commerciale, forces, faiblesses, positionnement et potentiel estimé.",
  },
  {
    icon: Users,
    title: "Recherche de clients",
    text: "Profils de clients idéaux, besoins, motivations et où les trouver.",
  },
  {
    icon: Search,
    title: "Concurrence",
    text: "Positionnement, offres et prix publics de vos concurrents, et comment vous différencier.",
  },
  {
    icon: Compass,
    title: "Stratégie marketing",
    text: "Objectifs, canaux, lancement, budget indicatif et calendrier sur 30 jours.",
  },
  {
    icon: Megaphone,
    title: "Publicités",
    text: "TikTok, Instagram, Facebook et Google Ads : variantes prêtes à copier.",
  },
  {
    icon: PenLine,
    title: "Création de contenu",
    text: "Scripts vidéo, carrousels, publications et calendrier éditorial.",
  },
  {
    icon: LineChart,
    title: "Optimisation des ventes",
    text: "Fiche produit, offre, page de vente et appels à l'action améliorés.",
  },
  {
    icon: MessageCircle,
    title: "Assistant IA",
    needsAi: true,
    text: "Vos questions de marketing, avec les informations de vos produits.",
  },
  {
    icon: Wand2,
    title: "Plan d'action",
    text: "Votre stratégie transformée en 3 tâches par jour, à cocher.",
  },
  {
    icon: GraduationCap,
    title: "Académie",
    text: "Le business expliqué simplement, leçon par leçon.",
  },
  {
    icon: BarChart3,
    title: "Résultats",
    text: "Ventes, dépenses et rentabilité, uniquement avec vos vrais chiffres.",
  },
  {
    icon: Lightbulb,
    title: "Trouver une idée",
    text: "Pas encore de produit ? Une idée à partir de ce que vous savez faire.",
  },
] as const;

const FAQ = [
  {
    q: "BookSync utilise-t-il vraiment l'intelligence artificielle ?",
    a: "Oui : les analyses, stratégies, publicités et contenus sont rédigés par des modèles d'IA gratuits (offres gratuites de Groq et Cloudflare). Si leur quota du jour est atteint, BookSync utilise ses propres modèles intégrés, et l'indique sous chaque résultat.",
  },
  {
    q: "BookSync garantit-il des ventes ?",
    a: "Non, et personne d'honnête ne peut le garantir. BookSync vous donne une analyse, une stratégie et un plan d'action quotidien. Les résultats dépendent de ce que vous mettez en place.",
  },
  {
    q: "D'où viennent les analyses et les chiffres ?",
    a: "Des informations que vous donnez et des pages publiques que vous indiquez (concurrents). BookSync n'invente aucune donnée de marché : une hypothèse est toujours signalée comme telle. Les statistiques n'utilisent que les résultats que vous saisissez.",
  },
  {
    q: "BookSync publie-t-il mes publicités ?",
    a: "Non. BookSync prépare vos publicités et vos contenus, prêts à copier ; vous les publiez vous-même. Aucune connexion à TikTok, Instagram, Facebook ou Google Ads n'est proposée sans être réellement disponible.",
  },
  {
    q: "Je débute, est-ce pour moi ?",
    a: "Oui. Sans diplôme ni expérience : l'Académie explique les bases, et le plan d'action vous dit quoi faire chaque jour.",
  },
  {
    q: "Puis-je arrêter quand je veux ?",
    a: "Oui. Sans engagement : vous résiliez en un clic depuis votre espace, et votre forfait reste actif jusqu'à la fin du mois payé.",
  },
];

const pill = "rounded-full px-6";

export default function LandingPage() {
  const starter = PLANS.starter;
  const aiLive = isAiAvailable();
  return (
    <main className="overflow-x-clip">
      <JsonLd data={SOFTWARE_LD} />

      {/* Hero */}
      <section className="relative isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(55%_55%_at_50%_0%,var(--primary-soft),transparent)]"
        />
        <div className="mx-auto w-full max-w-5xl px-4 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="animate-fade-up">
            <p className="text-sm font-semibold tracking-wide text-primary">
              <Sparkles className="mr-1 inline size-4 align-[-3px]" />
              Votre copilote marketing propulsé par l&apos;IA
            </p>
            <h1 className="mx-auto mt-4 max-w-4xl text-[2.6rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-7xl">
              De votre idée{" "}
              <span className="bg-gradient-to-r from-primary to-[#7c5cff] bg-clip-text text-transparent">
                à vos premières ventes.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
              BookSync transforme votre produit en stratégie marketing complète : analyse, clients
              cibles, concurrence, publicités, contenus et un plan d&apos;action sur 30 jours.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className={pill}>
                <Link href="/inscription">
                  <Rocket /> Commencer gratuitement
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className={pill}>
                <Link href="/lancer-mon-activite">
                  <Lightbulb /> Je n&apos;ai pas encore d&apos;idée
                </Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {[
                "Gratuit pour commencer",
                "Sans carte bancaire",
                "Aucune vente garantie, aucun chiffre inventé",
              ].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-success" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-14 w-full max-w-4xl px-4 pb-20 sm:px-6">
          <CopilotPreview />
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="avantages" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
            De votre produit à votre plan d&apos;action.
          </h2>
        </div>
        <ol className="mt-14 grid gap-4 sm:grid-cols-2" data-testid="steps">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-3xl border bg-card p-7">
              <p className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <Icon className="size-6 text-primary" strokeWidth={1.6} />
              </p>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-[15px] text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Outils */}
      <section id="fonctionnalites" className="scroll-mt-20 bg-subtle py-24">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
              Tout ce qu&apos;il faut pour vendre, au même endroit.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Tous les outils sont disponibles dès aujourd&apos;hui.
            </p>
          </div>
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="tools">
            {TOOLS.map(({ icon: Icon, title, text, ...rest }) => (
              <li key={title} className="flex flex-col rounded-3xl bg-card p-7">
                <div className="flex items-start justify-between gap-3">
                  <Icon className="size-8 text-primary" strokeWidth={1.6} />
                  {"needsAi" in rest && !aiLive ? (
                    <Badge variant="neutral">Bientôt</Badge>
                  ) : (
                    <Badge variant="success">Disponible</Badge>
                  )}
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-[15px] text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Académie */}
      <section id="academie" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary">Académie BookSync</p>
          <h2 className="mt-3 text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
            Apprenez le business en 5 minutes par jour.
          </h2>
        </div>
        <ul
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="academy-modules"
        >
          {ACADEMY.map((m) => (
            <li key={m.id} className="rounded-3xl border bg-card p-6">
              <h3 className="font-semibold">{m.title}</h3>
              <ul className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
                {m.lessons.map((l) => (
                  <li key={l.id} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {l.title}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {/* Offre */}
      <section className="px-4 pb-24 sm:px-6" data-testid="offer">
        <div className="mx-auto grid w-full max-w-5xl gap-8 rounded-[2.5rem] border bg-card p-8 sm:p-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold tracking-wide text-primary">L&apos;offre Starter</p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Tout BookSync pour {formatPrice(starter.priceCents)} par mois.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Moins qu&apos;un repas à emporter. Une seule vente à 10 € et votre mois est
              rentabilisé : la jauge de votre tableau de bord vous le montre.
            </p>
            <Button asChild size="lg" className={`mt-6 ${pill}`}>
              <Link href="/inscription">Commencer maintenant</Link>
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              Sans engagement, résiliable en un clic.
            </p>
          </div>
          <ul className="grid gap-3 text-[15px]">
            {starter.highlights.map((h) => (
              <li key={h} className="flex gap-2.5">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" /> {h}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="scroll-mt-20 bg-subtle py-24">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
              Des tarifs simples.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Commencez gratuitement, passez à Starter quand vous êtes prêt. Sans engagement, prix
              TTC par mois.
            </p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PLAN_ORDER.map((id) => {
              const p = PLANS[id];
              const featured = id === "starter";
              return (
                <div
                  key={id}
                  className={`relative flex flex-col rounded-3xl bg-card p-8 ${featured ? "shadow-xl ring-2 shadow-primary/10 ring-primary" : ""}`}
                >
                  {featured ? (
                    <Badge variant="primary" className="absolute -top-2.5 left-8">
                      Recommandé
                    </Badge>
                  ) : null}
                  <h3 className="text-xl font-semibold tracking-tight">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                  <p className="mt-6 text-5xl font-semibold tracking-tighter">
                    {p.priceCents ? formatPrice(p.priceCents) : "0 €"}
                    <span className="text-base font-normal tracking-normal text-muted-foreground">
                      {" "}
                      /mois
                    </span>
                  </p>
                  <ul className="mt-8 grid flex-1 gap-3 text-[15px]">
                    {p.highlights.map((h) => (
                      <li key={h} className="flex gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {h}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    size="lg"
                    className={`mt-8 w-full ${pill}`}
                    variant={featured ? "primary" : "secondary"}
                  >
                    <Link href="/inscription">
                      {id === "free" ? "Commencer gratuitement" : `Choisir ${p.name}`}
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6">
        <h2 className="text-center text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          Questions fréquentes.
        </h2>
        <div className="mt-12 divide-y border-y">
          {FAQ.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="cursor-pointer list-none text-lg font-medium">{f.q}</summary>
              <p className="mt-3 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center rounded-[2.5rem] bg-navy px-6 py-20 text-center text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/booky.svg" alt="Booky, la mascotte BookSync" width={120} height={132} />
          <h2 className="mt-6 max-w-2xl text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
            Votre première vente commence aujourd&apos;hui.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-white/60">
            Gratuit pour commencer. Sans carte bancaire. En français, de A à Z.
          </p>
          <Button
            asChild
            size="lg"
            className={`mt-10 bg-white text-navy hover:bg-white/90 ${pill}`}
          >
            <Link href="/inscription">Commencer gratuitement</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
