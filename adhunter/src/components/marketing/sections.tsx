import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  CheckCircle2,
  Filter,
  Library,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-400">{eyebrow}</p>
      <h2 className="mt-3 text-balance text-3xl font-semibold sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-balance text-muted-foreground">{description}</p>}
    </div>
  );
}

export const FEATURES = [
  {
    icon: Library,
    title: "Ad Library multi-sources",
    description:
      "Recherche dans les bibliothèques publicitaires officielles (Meta Ad Library, TikTok Commercial Content API) avec des filtres par niche, pays, langue, format et période.",
  },
  {
    icon: Sparkles,
    title: "AI Ad Analyzer",
    description:
      "Décortique l'accroche, le public cible probable, le problème traité, les techniques utilisées, les forces et les faiblesses d'une publicité.",
  },
  {
    icon: Wand2,
    title: "Ad Creator",
    description:
      "Génère des accroches, des textes, des appels à l'action et des concepts vidéo originaux, adaptés à TikTok, Instagram et Facebook.",
  },
  {
    icon: BarChart3,
    title: "Trend Radar",
    description:
      "Observe les niches, mots-clés et formats qui reviennent dans les données réellement collectées, avec la taille de l'échantillon toujours affichée.",
  },
  {
    icon: Bookmark,
    title: "Favoris et collections",
    description: "Sauvegarde les publicités qui t'inspirent, ajoute des notes et organise tes recherches par niche ou par client.",
  },
  {
    icon: Users,
    title: "Travail en équipe",
    description: "Partage des collections avec ton équipe et exporte des rapports CSV ou JSON pour tes clients (formule Business).",
  },
];

export function Features() {
  return (
    <section id="plateforme" className="container scroll-mt-24 py-24">
      <SectionHeading
        eyebrow="Fonctionnalités"
        title="Tout ce qu'il faut pour comprendre ton marché publicitaire"
        description="Une plateforme claire, même si tu débutes en marketing digital."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article key={f.title} className="surface card-hover p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-violet-400">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { icon: Filter, title: "Recherche", text: "Choisis une niche, un pays, une plateforme ou un mot-clé. AdHunter interroge les bibliothèques publicitaires officielles." },
    { icon: Sparkles, title: "Analyse", text: "Enregistre les publicités intéressantes et lance une analyse IA pour comprendre leur stratégie." },
    { icon: Lightbulb, title: "Création", text: "Transforme ces enseignements en accroches, textes et concepts vidéo originaux pour tes propres campagnes." },
  ];
  return (
    <section className="border-y border-border/60 bg-card/30 py-24">
      <div className="container">
        <SectionHeading eyebrow="Comment ça marche" title="De la veille à la campagne en 3 étapes" />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative surface p-6">
              <span className="font-mono text-xs text-violet-400">0{i + 1}</span>
              <s.icon className="mt-4 h-6 w-6 text-foreground" />
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Transparency() {
  const points = [
    "Uniquement des sources officielles et autorisées — aucun scraping interdit.",
    "Aucun chiffre de ventes, de budget ou de conversion inventé : ces données ne sont pas publiques.",
    "Les analyses IA sont présentées comme des estimations, jamais comme des performances vérifiées.",
    "Les tendances affichent toujours la taille de l'échantillon sur lequel elles reposent.",
  ];
  return (
    <section className="container py-24">
      <div className="surface grid gap-10 overflow-hidden p-8 md:grid-cols-2 md:p-12">
        <div>
          <ShieldCheck className="h-8 w-8 text-violet-400" />
          <h2 className="mt-5 text-balance text-3xl font-semibold">Des données honnêtes, pour des décisions solides</h2>
          <p className="mt-4 text-muted-foreground">
            La veille publicitaire n'a de valeur que si elle est fiable. AdHunter te montre ce qui est réellement observable — et te dit clairement ce qui ne l'est pas.
          </p>
        </div>
        <ul className="space-y-4">
          {points.map((p) => (
            <li key={p} className="flex gap-3 text-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-violet-400" />
              <span className="text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export const FAQ_ITEMS = [
  {
    q: "D'où viennent les publicités affichées ?",
    a: "Des bibliothèques publicitaires officielles : la Meta Ad Library API (Facebook, Instagram) et la TikTok Commercial Content API. Ces bibliothèques rendent publiques les publicités diffusées dans l'Union européenne au titre du Digital Services Act. AdHunter n'utilise aucun scraping interdit par les plateformes.",
  },
  {
    q: "Puis-je voir les ventes, le budget ou le taux de conversion d'une publicité ?",
    a: "Non. Ces informations ne sont pas publiques et AdHunter ne prétend jamais les connaître. Nous affichons ce que les sources officielles publient : texte, annonceur, plateformes, dates de diffusion et lien vers la source originale.",
  },
  {
    q: "L'analyse IA est-elle fiable ?",
    a: "L'IA fournit une lecture marketing argumentée (accroche, cible probable, techniques, forces, faiblesses). Ce sont des estimations utiles pour réfléchir et s'inspirer, pas des données de performance vérifiées.",
  },
  {
    q: "Les textes générés par Ad Creator sont-ils originaux ?",
    a: "Oui. Le générateur est conçu pour produire des textes originaux et ne reproduit pas les publicités analysées. Pense toutefois à relire et adapter chaque texte avant diffusion.",
  },
  {
    q: "Puis-je résilier mon abonnement à tout moment ?",
    a: "Oui, en quelques clics depuis la page Abonnement. La résiliation prend effet à la fin de la période payée ; tu gardes l'accès jusque-là. Aucun engagement de durée.",
  },
  {
    q: "La formule Free est-elle vraiment gratuite ?",
    a: "Oui, sans carte bancaire. Elle inclut un nombre limité de recherches, 5 analyses IA par mois et une collection pour découvrir la plateforme.",
  },
  {
    q: "Mes données sont-elles protégées ?",
    a: "Tes recherches, favoris, collections et analyses sont privés et isolés par des règles de sécurité au niveau de la base de données. Tu peux exporter ou supprimer toutes tes données à tout moment depuis tes paramètres (RGPD).",
  },
];

export function Faq() {
  return (
    <section id="faq" className="container max-w-3xl scroll-mt-24 py-24">
      <SectionHeading eyebrow="FAQ" title="Questions fréquentes" />
      <Accordion type="single" collapsible className="mt-10">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.q} value={item.q}>
            <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

/**
 * Testimonials render only when real, verified quotes are added here
 * (with the customer's consent). Never fill this with invented quotes.
 */
export const TESTIMONIALS: { quote: string; name: string; role: string }[] = [];

export function Testimonials() {
  if (!TESTIMONIALS.length) return null;
  return (
    <section className="container py-24">
      <SectionHeading eyebrow="Témoignages" title="Ils utilisent AdHunter" />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <figure key={t.name} className="surface p-6">
            <blockquote className="text-sm leading-relaxed">“{t.quote}”</blockquote>
            <figcaption className="mt-4 text-sm text-muted-foreground">
              {t.name} — {t.role}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="container pb-24">
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card px-6 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 bg-radial-violet" aria-hidden />
        <h2 className="relative text-balance text-3xl font-semibold sm:text-4xl">Prêt à comprendre ce qui fonctionne sur ton marché ?</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">Crée ton compte gratuit en moins d'une minute. Sans carte bancaire.</p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="brand" size="lg">
            <Link href="/signup">
              Commencer gratuitement <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/tarifs">Voir les tarifs</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
