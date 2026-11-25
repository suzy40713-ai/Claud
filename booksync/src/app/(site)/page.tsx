import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Check,
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
import { ACADEMY, ALL_LESSONS } from "@/domain/academy/lessons";
import { PLAN_ORDER, PLANS, formatPrice } from "@/domain/billing/plans";
import { TALENTS } from "@/domain/launch/ideas";
import { site } from "@/lib/site";

const SEO_DESCRIPTION =
  "BookSync aide les débutants à gagner leurs premiers euros : trouver quoi vendre, apprendre le business leçon par leçon et savoir chaque jour quoi faire pour vendre. Gratuit pour commencer.";

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
    title: "Trouve quoi vendre",
    text: `Choisis ce que tu sais déjà faire : BookSync te propose une idée parmi ${IDEA_COUNT}, avec un prix de départ et à qui la vendre.`,
  },
  {
    icon: GraduationCap,
    title: "Apprends le business",
    text: `${ALL_LESSONS.length} leçons de 5 minutes : fixer ton prix, trouver tes premiers clients, vendre sans être lourd, te faire connaître.`,
  },
  {
    icon: Wand2,
    title: "Suis ton plan, chaque jour",
    text: "Ta stratégie sur 30 jours devient 3 actions simples par jour. Tu coches, tu avances, tu ne te demandes plus quoi faire.",
  },
  {
    icon: Target,
    title: "Vends et rentabilise",
    text: "Note tes ventes : ta jauge montre quand ton abonnement est rentabilisé. Tout le reste, c'est pour toi.",
  },
] as const;

const TOOLS = [
  { icon: Lightbulb, title: "Trouver une idée", text: "Quoi vendre, à quel prix, à qui, et tes 3 premières actions." },
  { icon: GraduationCap, title: "Académie", text: "Le business expliqué simplement, avec une action après chaque leçon." },
  { icon: Target, title: "Analyse de ton produit", text: "Points forts, points faibles, acheteurs possibles et objections." },
  { icon: Compass, title: "Stratégie 30 jours", text: "Adaptée à ton temps, à ton budget et à tes réseaux." },
  { icon: Wand2, title: "Autopilot", text: "3 actions par jour à cocher et ta progression sur 30 jours." },
  { icon: Megaphone, title: "Publicités", text: "TikTok, Instagram, Facebook, Google Ads, dans 5 styles." },
  { icon: PenLine, title: "Contenus", text: "Scripts vidéo, carrousels, légendes et hashtags prêts à publier." },
  { icon: LineChart, title: "Sales Booster", text: "Ce qui freine tes ventes et quoi changer sur ta page." },
  { icon: BarChart3, title: "Mes résultats", text: "Ventes, dépenses, coût par vente et rentabilité de ton abonnement." },
] as const;

const FAQ = [
  {
    q: "Je n'y connais rien, c'est pour moi ?",
    a: "Oui, BookSync est fait pour les débutants. Tu n'as besoin ni de diplôme, ni d'expérience, ni d'argent de départ. Tout est expliqué simplement, étape par étape.",
  },
  {
    q: "Est-ce que BookSync garantit que je vais gagner de l'argent ?",
    a: "Non, et personne d'honnête ne peut te le garantir. BookSync te donne une idée, une méthode et un plan d'action quotidien. Les résultats dépendent de ce que tu fais : plus tu suis ton Autopilot, plus tu te donnes de chances.",
  },
  {
    q: "Combien de temps faut-il par jour ?",
    a: "Tu choisis : la stratégie s'adapte à ton temps disponible, dès 1 à 2 heures par semaine. Les 3 actions du jour prennent en général entre 15 et 45 minutes.",
  },
  {
    q: "Pourquoi payer si le forfait Free existe ?",
    a: "Le forfait Free sert à trouver ton idée et à découvrir l'Académie. Starter débloque toute l'Académie débutant, des propositions illimitées et le suivi de ta rentabilité. Une seule vente à 10 € rembourse ton mois.",
  },
  {
    q: "Puis-je arrêter quand je veux ?",
    a: "Oui. Sans engagement : tu résilies en un clic depuis ton espace, et ton forfait reste actif jusqu'à la fin du mois payé. Tes données sont conservées.",
  },
  {
    q: "BookSync publie-t-il à ma place sur les réseaux ?",
    a: "Non. BookSync prépare tes contenus et tes publicités, et c'est toi qui les publies. Aucune connexion à un réseau social n'est proposée sans être réellement disponible.",
  },
];

const pill = "rounded-full px-6";

export default function LandingPage() {
  const starter = PLANS.starter;
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
              Pour les débutants qui veulent gagner leurs premiers euros
            </p>
            <h1 className="mx-auto mt-4 max-w-4xl text-[2.6rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-7xl">
              De zéro{" "}
              <span className="bg-gradient-to-r from-primary to-[#7c5cff] bg-clip-text text-transparent">
                à ta première vente.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
              Tu ne sais pas quoi vendre ni par où commencer ? BookSync trouve ton idée,
              t&apos;apprend le business et te dit chaque jour quoi faire. Toi, tu n&apos;as plus
              qu&apos;à suivre.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className={pill}>
                <Link href="/inscription">
                  <Rocket /> Commencer gratuitement
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className={pill}>
                <Link href="/lancer-mon-activite">
                  <Lightbulb /> Trouver mon idée en 2 minutes
                </Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Sans diplôme", "Sans argent de départ", "Sans montrer ton visage"].map((t) => (
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
            4 étapes. Zéro prise de tête.
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
            {TOOLS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex flex-col rounded-3xl bg-card p-7">
                <div className="flex items-start justify-between gap-3">
                  <Icon className="size-8 text-primary" strokeWidth={1.6} />
                  <Badge variant="success">Disponible</Badge>
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
            Apprends le business en 5 minutes par jour.
          </h2>
        </div>
        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="academy-modules">
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
              Moins qu&apos;un repas à emporter. Une seule vente à 10 € et ton mois est
              rentabilisé : la jauge de ton accueil te le montre.
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
              Commence gratuitement, passe à Starter quand tu es prêt(e). Sans engagement, prix TTC
              par mois.
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
            Ta première vente commence aujourd&apos;hui.
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
