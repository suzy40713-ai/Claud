import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import {
  BarChart3,
  CalendarCheck2,
  Check,
  Compass,
  Gift,
  Lightbulb,
  LineChart,
  Megaphone,
  MessageCircle,
  PenLine,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { CopilotPreview } from "@/components/marketing/copilot-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { PLAN_ORDER, PLANS, formatPrice } from "@/domain/billing/plans";
import { isAiConfigured } from "@/lib/ai-config";
import { site } from "@/lib/site";

const SEO_DESCRIPTION =
  "BookSync, le copilote marketing des entrepreneurs, freelances et créateurs : trouvez quoi vendre, analysez votre produit, construisez votre stratégie, créez vos publicités et vos contenus. Gratuit pour commencer.";

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

const AUDIENCE = [
  "Entrepreneurs",
  "E-commerçants",
  "Créateurs de contenu",
  "Freelances",
  "Indépendants",
  "Produits physiques",
  "Produits numériques",
  "Petites entreprises",
];

const STEPS = [
  ["Présentez votre activité", "Ce que vous vendez, à qui, à quel prix. Deux minutes suffisent."],
  [
    "Ajoutez votre produit",
    "Une description, des avantages, un lien : BookSync s'occupe du reste.",
  ],
  ["Recevez l'analyse", "Proposition de valeur, clients cibles, arguments, points faibles."],
  ["Suivez votre plan", "Une stratégie sur 30 jours et, chaque jour, les actions à faire."],
] as const;

/** Outils du copilote, avec leur état réel de disponibilité. */
const TOOLS: Array<{
  icon: typeof Target;
  title: string;
  text: string;
  /** live : disponible ; ai : disponible dès que les fonctions IA sont activées. */
  status: "live" | "ai";
  href: string;
}> = [
  {
    icon: Lightbulb,
    title: "Trouver quoi vendre",
    text: "Vous ne savez pas encore quoi proposer ? À partir de ce que vous savez faire, BookSync vous propose une idée, un nom, des prix et un plan sur 7 jours.",
    status: "live",
    href: "/lancer-mon-activite",
  },
  {
    icon: Target,
    title: "Analyse de produit",
    text: "Proposition de valeur, clients cibles, problème résolu, arguments de vente, risques et pistes d'amélioration. Les hypothèses sont toujours signalées comme telles.",
    status: "ai",
    href: "/inscription",
  },
  {
    icon: Compass,
    title: "Stratégie marketing",
    text: "Objectifs, positionnement, canaux, contenu, budget conseillé et calendrier de 30 jours, avec des actions concrètes.",
    status: "ai",
    href: "/inscription",
  },
  {
    icon: Megaphone,
    title: "Créateur de publicités",
    text: "TikTok, Instagram, Facebook et Google Ads : accroche, texte, appel à l'action, idée de visuel et variantes, dans 5 styles.",
    status: "ai",
    href: "/inscription",
  },
  {
    icon: PenLine,
    title: "Contenus et scripts vidéo",
    text: "Idées de vidéos, scripts (accroche, développement, produit, appel à l'action), carrousels, descriptions et calendrier de publication.",
    status: "ai",
    href: "/inscription",
  },
  {
    icon: LineChart,
    title: "Sales Booster",
    text: "Analyse de votre page de vente, descriptions améliorées, offres commerciales et idées de tests A/B.",
    status: "ai",
    href: "/inscription",
  },
  {
    icon: MessageCircle,
    title: "Assistant marketing",
    text: "« Comment trouver mes 10 premiers clients ? » Des réponses qui tiennent compte de vos produits et de votre stratégie.",
    status: "ai",
    href: "/inscription",
  },
  {
    icon: Wand2,
    title: "Autopilot",
    text: "Chaque jour, les 3 prochaines actions pour promouvoir votre produit, à cocher, et la progression de votre plan sur 30 jours.",
    status: "ai",
    href: "/inscription",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord",
    text: "Produits, stratégies, publicités et contenus, budget, dépenses et résultats déclarés, retour sur investissement quand les données le permettent.",
    status: "live",
    href: "/inscription",
  },
];

/** Module de vente de services sur rendez-vous : déjà disponible. */
const BOOKING = [
  {
    icon: CalendarCheck2,
    title: "Page de réservation et agenda",
    text: "Vos clients réservent seuls, 24 h/24, rappels automatiques, liste d'attente.",
  },
  {
    icon: ShieldCheck,
    title: "Paiement en ligne",
    text: "Acompte ou séance payée à l'avance, versé directement sur votre compte Stripe.",
  },
  {
    icon: Gift,
    title: "Cartes cadeaux et avis",
    text: "Vendez des cartes cadeaux en ligne et collectez des avis vérifiés.",
  },
];

const FAQ = [
  {
    q: "À qui s'adresse BookSync ?",
    a: "Aux entrepreneurs, e-commerçants, créateurs, freelances et petites entreprises qui vendent un produit (physique ou numérique) ou un service, et qui veulent trouver des clients sans agence ni gros budget.",
  },
  {
    q: "BookSync garantit-il des ventes ?",
    a: "Non. Personne ne peut garantir des ventes. BookSync vous aide à structurer votre marketing, à produire vos contenus et à suivre vos résultats ; les décisions et les résultats restent les vôtres.",
  },
  {
    q: "D'où viennent les analyses et les chiffres ?",
    a: "Les analyses s'appuient sur les informations que vous donnez. BookSync n'invente pas de données de marché : une hypothèse est toujours présentée comme une hypothèse à vérifier. Les statistiques marketing utilisent uniquement les résultats que vous saisissez : aucune estimation n'est présentée comme un résultat.",
  },
  {
    q: "BookSync publie-t-il à ma place sur TikTok ou Instagram ?",
    a: "Non, pas aujourd'hui : BookSync prépare vos publicités et vos contenus, que vous publiez vous-même. Aucune connexion à un réseau social n'est proposée sans être réellement disponible et testée.",
  },
  {
    q: "Puis-je toujours prendre des rendez-vous en ligne ?",
    a: "Oui. La prise de rendez-vous, le paiement en ligne, les cartes cadeaux et les avis restent disponibles, sous forme d'un module pour ceux qui vendent des services.",
  },
  {
    q: "Puis-je commencer gratuitement ?",
    a: "Oui, le forfait Free est gratuit sans limite de durée et sans carte bancaire. Les forfaits payants offrent le premier mois et sont sans engagement.",
  },
  {
    q: "Où sont stockées mes données ?",
    a: "Dans l'Union européenne. Chaque compte est isolé, et vous pouvez exporter ou supprimer vos données depuis vos paramètres.",
  },
];

const pill = "rounded-full px-6";

function StatusBadge({ status }: { status: "live" | "soon" }) {
  return status === "live" ? (
    <Badge variant="success">Disponible</Badge>
  ) : (
    <Badge variant="neutral">En déploiement</Badge>
  );
}

export default function LandingPage() {
  const aiLive = isAiConfigured();
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
              Le copilote marketing des entrepreneurs
            </p>
            <h1 className="mx-auto mt-4 max-w-4xl text-[2.6rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-7xl">
              De votre idée{" "}
              <span className="bg-gradient-to-r from-primary to-[#7c5cff] bg-clip-text text-transparent">
                à vos premières ventes.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
              Présentez votre produit ou votre service : BookSync l&apos;analyse, construit votre
              stratégie, prépare vos publicités et vos contenus, et vous dit chaque jour quoi faire.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className={pill}>
                <Link href="/inscription?pro=1">
                  <Rocket /> Commencer gratuitement
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className={pill}>
                <Link href="/lancer-mon-activite">
                  <Lightbulb /> Je ne sais pas quoi vendre
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

      {/* Public */}
      <section className="border-y">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 text-center sm:px-6">
          <p className="text-sm font-medium text-muted-foreground">
            Pour tous ceux qui ont quelque chose à vendre
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px] font-medium text-foreground/80">
            {AUDIENCE.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="avantages" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-24 sm:px-6">
        <h2 className="mx-auto max-w-3xl text-center text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
          Un système de travail, pas juste du texte.
        </h2>
        <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t}>
              <span className="bg-gradient-to-b from-primary to-[#7c5cff] bg-clip-text text-5xl font-semibold tracking-tighter text-transparent">
                {i + 1}
              </span>
              <h3 className="mt-3 text-lg font-semibold tracking-tight">{t}</h3>
              <p className="mt-2 text-[15px] text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Outils */}
      <section id="fonctionnalites" className="scroll-mt-20 bg-subtle py-24">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
              Tout votre marketing au même endroit.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Les outils arrivent progressivement : chaque carte indique s&apos;il est déjà
              disponible.
            </p>
          </div>
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="tools">
            {TOOLS.map(({ icon: Icon, title, text, status: kind, href }) => {
              const status = kind === "live" || aiLive ? "live" : "soon";
              return (
              <li key={title} className="flex flex-col rounded-3xl bg-card p-7">
                <div className="flex items-start justify-between gap-3">
                  <Icon className="size-8 text-primary" strokeWidth={1.6} />
                  <StatusBadge status={status} />
                </div>
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-[15px] text-muted-foreground">{text}</p>
                {status === "live" ? (
                  <Link
                    href={href as Route}
                    className="mt-4 text-sm font-semibold text-primary hover:underline"
                  >
                    Essayer maintenant →
                  </Link>
                ) : null}
              </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Module rendez-vous */}
      <section id="pourquoi" className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary">
            Module rendez-vous · disponible
          </p>
          <h2 className="mt-3 text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            Vous vendez des services ? Encaissez-les en ligne.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Coachs, freelances, professeurs, salons : une page où vos clients réservent et paient,
            sans commission BookSync.
          </p>
        </div>
        <ul className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-3">
          {BOOKING.map(({ icon: Icon, title, text }) => (
            <li key={title} data-testid="usp">
              <Icon className="size-7 text-primary" strokeWidth={1.6} />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-[15px] text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="scroll-mt-20 bg-subtle py-24">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl leading-[1.08] font-semibold tracking-[-0.03em] sm:text-6xl">
              Des tarifs simples.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              1er mois offert sur les forfaits payants. Sans engagement, prix TTC par mois.
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
                  {p.priceCents ? (
                    <p className="mt-2 text-[13px] font-medium text-primary">
                      1er mois offert · sans engagement
                    </p>
                  ) : null}
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
                      {id === "free" ? "Commencer gratuitement" : `Essayer ${p.name}`}
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
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium">
                {f.q}
                <span className="text-2xl leading-none font-light text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[15px] text-muted-foreground">{f.a}</p>
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
            <Link href="/inscription?pro=1">Commencer gratuitement</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
