import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgePercent,
  BarChart3,
  CalendarX2,
  Euro,
  HeartHandshake,
  Hourglass,
  BellRing,
  CalendarCheck2,
  CalendarDays,
  Check,
  Clock4,
  Globe2,
  LockKeyhole,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_ORDER, PLANS, formatPrice } from "@/domain/billing/plans";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";

const SEO_DESCRIPTION =
  "Logiciel de prise de rendez-vous en ligne pour coiffeurs, barbiers, esthéticiennes et ongleries : réservation 24h/24, rappels automatiques, acompte contre les lapins, avis clients. 1er mois offert, 0 % de commission.";

export const metadata: Metadata = {
  title: {
    absolute: `${site.name} — Prise de rendez-vous en ligne pour coiffeurs, barbiers et instituts`,
  },
  description: SEO_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${site.name} — La prise de rendez-vous en ligne pour votre salon`,
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
  "Coiffeurs",
  "Barbiers",
  "Esthéticiennes",
  "Coachs sportifs",
  "Photographes",
  "Professeurs particuliers",
  "Kinésithérapeutes",
  "Garages",
  "Et tous les métiers sur rendez-vous",
];

const FEATURES = [
  {
    icon: Globe2,
    title: "Page de réservation en ligne",
    text: "Votre adresse booksync.fr/votre-nom : vos clients choisissent la prestation, la personne et l'horaire, 24 h/24, sans créer de compte.",
  },
  {
    icon: CalendarDays,
    title: "Agenda jour, semaine, mois",
    text: "Toute l'équipe dans un seul calendrier, filtrable par employé. Ajoutez, déplacez ou annulez un rendez-vous en un geste.",
  },
  {
    icon: Clock4,
    title: "Horaires, pauses et fermetures",
    text: "Horaires par employé, pauses, congés et jours fériés : seuls les créneaux réellement libres sont proposés.",
  },
  {
    icon: BellRing,
    title: "Confirmations et rappels",
    text: "Email de confirmation instantané, puis rappels automatiques 24 h et 2 h avant le rendez-vous.",
  },
  {
    icon: Users,
    title: "Équipe et rôles",
    text: "Invitez vos collaborateurs par email. Propriétaire, administrateur ou employé : chacun accède à ce dont il a besoin.",
  },
  {
    icon: BarChart3,
    title: "Statistiques utiles",
    text: "Rendez-vous, chiffre d'affaires, taux d'annulation et d'absence, services phares : calculés depuis vos vraies réservations.",
  },
];

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Zéro double réservation",
    text: "Chaque créneau est vérifié côté serveur et verrouillé en base de données, même si deux clients réservent à la même seconde.",
  },
  {
    icon: Smartphone,
    title: "Pensé pour le mobile",
    text: "Vos clients réservent depuis leur téléphone en moins d'une minute. Vous gérez votre agenda partout.",
  },
  {
    icon: Zap,
    title: "Prêt en 5 minutes",
    text: "Choisissez votre activité : vos horaires et des prestations types sont proposés. Ajustez, partagez votre lien, c'est parti.",
  },
  {
    icon: LockKeyhole,
    title: "Vos données protégées",
    text: "Hébergement en Europe, données de chaque entreprise strictement isolées, export et suppression à tout moment (RGPD).",
  },
];

const USP = [
  {
    icon: Euro,
    title: "Un prix clair, sans devis",
    text: "Gratuit pour commencer, puis 9,99 € ou 24,99 € par mois. Le prix affiché est le prix payé.",
  },
  {
    icon: BadgePercent,
    title: "0 % de commission",
    text: "Vos clients restent les vôtres, même ceux qui vous découvrent dans l'annuaire BookSync. Aucun pourcentage prélevé.",
  },
  {
    icon: CalendarX2,
    title: "Sans engagement",
    text: "Résiliez depuis votre espace en un clic : l'abonnement s'arrête à la fin du mois payé et vous gardez vos données.",
  },
  {
    icon: LockKeyhole,
    title: "Vos données en Europe",
    text: "Hébergement dans l'Union européenne, export et suppression à tout moment, conformément au RGPD.",
  },
  {
    icon: HeartHandshake,
    title: "Une vraie personne, pas un robot",
    text: "On peut installer BookSync pour vous : prestations, horaires, lien sur votre Instagram. Et on vous répond directement.",
  },
  {
    icon: Hourglass,
    title: "Les annulations récupérées",
    text: "La liste d'attente intelligente repropose automatiquement un créneau annulé à vos clients en attente (forfait Pro).",
  },
];

const FAQ = [
  {
    q: "BookSync prend-il une commission sur mes clients ?",
    a: "Non, jamais. Vous payez uniquement votre abonnement (ou rien avec le forfait gratuit), quel que soit le nombre de rendez-vous ou de nouveaux clients.",
  },
  {
    q: "Mes clients doivent-ils créer un compte ?",
    a: "Non. Ils réservent avec leur nom et leur email, et reçoivent un lien personnel pour modifier ou annuler leur rendez-vous.",
  },
  {
    q: "Comment mes clients paient-ils ?",
    a: "Directement chez vous, sur place, comme d'habitude. BookSync n'encaisse aucun paiement de vos clients.",
  },
  {
    q: "Puis-je essayer gratuitement ?",
    a: "Oui. Le forfait Free est gratuit sans limite de durée et sans carte bancaire : 5 réservations par mois, 1 employé, 20 clients.",
  },
  {
    q: "Puis-je changer de forfait ou résilier ?",
    a: "À tout moment, depuis votre espace. Le changement est immédiat et calculé au prorata ; une résiliation prend effet à la fin du mois payé, sans perte de données.",
  },
  {
    q: "Que se passe-t-il si deux clients choisissent le même créneau ?",
    a: "Un seul obtient le rendez-vous : la vérification est faite par la base de données elle-même. Le second est invité à choisir un autre horaire.",
  },
  {
    q: "Où sont stockées mes données ?",
    a: "Dans l'Union européenne. Vous pouvez exporter toutes vos données ou supprimer votre compte depuis vos paramètres.",
  },
];

const SHOWCASE = [
  { src: "/pack/10-page-note.jpg", title: "Votre page", text: "Prestations, prix, avis." },
  { src: "/pack/03-creneaux.jpg", title: "Vos créneaux", text: "Réservés 24 h/24." },
  { src: "/pack/17-agenda.jpg", title: "Votre agenda", text: "Mis à jour tout seul." },
];

const pill = "rounded-full px-6";

export default function LandingPage() {
  return (
    <main className="overflow-x-clip">
      <JsonLd data={SOFTWARE_LD} />
      {/* Hero : centré, grande typographie, produit en vedette */}
      <section className="relative isolate">
        <div className="mx-auto w-full max-w-5xl px-4 pt-16 text-center sm:px-6 sm:pt-28">
          <div className="animate-fade-up">
            <p className="text-sm font-semibold tracking-wide text-primary">
              <Sparkles className="mr-1 inline size-4 align-[-3px]" />
              Trouver, réserver, gérer ses rendez-vous
            </p>
            <h1 className="mx-auto mt-4 max-w-4xl text-[2.75rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-7xl lg:text-[5.5rem]">
              Vos rendez-vous.{" "}
              <span className="bg-gradient-to-r from-primary to-[#8b5cf6] bg-clip-text text-transparent">
                Parfaitement organisés.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-xl">
              Trouvez un professionnel près de chez vous et réservez en quelques secondes.
              Professionnels : gérez votre agenda et automatisez vos rendez-vous.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className={pill}>
                <Link href="/inscription?pro=1">
                  <Store /> Je suis un professionnel
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className={pill}>
                <Link href="/professionnels">
                  <Search /> Je cherche un professionnel
                </Link>
              </Button>
            </div>
            <p className="mt-4 text-sm font-medium text-primary">
              Professionnels : 1er mois offert · 0 % de commission · sans engagement
            </p>
            <form
              action="/professionnels"
              role="search"
              className="mx-auto mt-8 flex max-w-xl gap-2 rounded-full border bg-card p-1.5 shadow-sm"
            >
              <input
                name="q"
                aria-label="Métier ou prestation"
                placeholder="Coiffeur, barbier, coach…"
                className="min-w-0 flex-1 rounded-full bg-transparent px-4 text-[15px] outline-none"
              />
              <input
                name="lieu"
                aria-label="Ville ou code postal"
                placeholder="Ville"
                className="w-24 min-w-0 border-l bg-transparent px-3 text-[15px] outline-none sm:w-36"
              />
              <Button type="submit" size="icon" aria-label="Rechercher" className="rounded-full">
                <Search />
              </Button>
            </form>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {[
                "Gratuit pour les particuliers",
                "Sans compte pour réserver",
                "Paiement sur place",
              ].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-success" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative mx-auto mt-16 w-full max-w-5xl px-4 pb-24 sm:mt-20 sm:px-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-10 -z-10 h-[80%] bg-[radial-gradient(50%_50%_at_50%_50%,var(--primary-soft),transparent)] blur-2xl"
          />
          <DashboardPreview />
        </div>
      </section>

      {/* Public cible */}
      <section className="border-y">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 text-center sm:px-6">
          <p className="text-sm font-medium text-muted-foreground">
            Pour les professionnels qui travaillent sur rendez-vous
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px] font-medium text-foreground/80">
            {AUDIENCE.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Présentation : énoncé fort + 3 étapes */}
      <section className="mx-auto w-full max-w-5xl px-4 py-24 sm:px-6 sm:py-32">
        <h2 className="mx-auto max-w-3xl text-center text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
          Fini les appels pendant les rendez-vous.
        </h2>
        <div className="mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
          {[
            [
              "1",
              "Créez votre page",
              "Votre activité, vos horaires et vos prestations. BookSync vous propose une base adaptée à votre métier.",
            ],
            [
              "2",
              "Partagez votre lien",
              "Sur votre site, Instagram, Google ou par SMS. Vos clients réservent seuls, à toute heure.",
            ],
            [
              "3",
              "Concentrez-vous sur vos clients",
              "Confirmations, rappels et agenda se mettent à jour automatiquement. Fini les appels pendant les rendez-vous.",
            ],
          ].map(([n, t, d]) => (
            <div key={n} className="text-center sm:text-left">
              <span className="bg-gradient-to-b from-primary to-[#8b5cf6] bg-clip-text text-6xl font-semibold tracking-tighter text-transparent">
                {n}
              </span>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{t}</h3>
              <p className="mt-2 text-[15px] text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vitrine produit sur fond sombre */}
      <section className="bg-[#0a0a0c] py-24 text-white sm:py-32">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <h2 className="mx-auto max-w-3xl text-center text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
            Vos clients réservent. <span className="text-white/50">Même à 23 h.</span>
          </h2>
          <ul className="-mx-4 mt-16 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:px-0">
            {SHOWCASE.map((s) => (
              <li key={s.src} className="w-[64%] shrink-0 snap-center sm:w-auto">
                <div className="overflow-hidden rounded-[2.25rem] border-[7px] border-white/15 bg-white shadow-2xl shadow-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.src}
                    alt={`${s.title} (exemple)`}
                    width={600}
                    height={1299}
                    loading="lazy"
                    className="aspect-[390/844] w-full object-cover object-top"
                  />
                </div>
                <p className="mt-5 text-center font-semibold">{s.title}</p>
                <p className="text-center text-sm text-white/60">{s.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Fonctionnalités : grille « bento » */}
      <section id="fonctionnalites" className="scroll-mt-20 py-24 sm:py-32">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
              Tout ce qu&apos;il faut. Rien de superflu.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Les outils essentiels pour remplir votre agenda et réduire les rendez-vous manqués.
            </p>
          </div>
          <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className={`rounded-3xl bg-subtle p-8 ${[0, 3, 4].includes(i) ? "lg:col-span-2" : ""}`}
              >
                <Icon className="size-8 text-primary" strokeWidth={1.6} />
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-[15px] text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Avantages */}
      <section id="avantages" className="scroll-mt-20 bg-subtle py-24 sm:py-32">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
              Fiable. Rapide. Sécurisé.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              BookSync a été conçu pour que vous n&apos;ayez jamais à vous soucier de votre agenda.
            </p>
          </div>
          <ul className="mt-16 grid gap-4 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl bg-card p-8">
                <Icon className="size-8 text-primary" strokeWidth={1.6} />
                <h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-[15px] text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 text-center">
            <Button asChild size="lg" className={pill}>
              <Link href="/inscription">Créer mon compte gratuit</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pourquoi BookSync (USP) */}
      <section
        id="pourquoi"
        className="mx-auto w-full max-w-5xl scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold tracking-wide text-primary">
            Pour les professionnels
          </p>
          <h2 className="mt-3 text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
            La réservation en ligne au prix affiché.
          </h2>
          <p className="mt-5 text-lg text-pretty text-muted-foreground">
            Dès 9,99 € par mois, sans commission, sans engagement, et une vraie personne pour vous
            l&apos;installer.
          </p>
        </div>
        <ul className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {USP.map(({ icon: Icon, title, text }) => (
            <li key={title} data-testid="usp">
              <Icon className="size-7 text-primary" strokeWidth={1.6} />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-1.5 text-[15px] text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="scroll-mt-20 bg-subtle py-24 sm:py-32">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl leading-[1.08] font-semibold tracking-[-0.03em] sm:text-6xl">
              Des tarifs simples.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              1er mois offert sur Starter et Pro. Sans engagement, prix TTC par mois.
            </p>
          </div>
          <div className="mt-16 grid gap-4 lg:grid-cols-3">
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
                      Le plus choisi
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
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
            Commencez sur Free, passez à un forfait payant quand vous le souhaitez depuis votre
            espace : les 30 premiers jours sont offerts, aucun prélèvement avant la fin de
            l&apos;essai, résiliable à tout moment.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32"
      >
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
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center rounded-[2.5rem] bg-[#0a0a0c] px-6 py-20 text-center text-white sm:py-24">
          <CalendarCheck2 className="size-12 text-[#8fb0ff]" strokeWidth={1.5} />
          <h2 className="mt-6 max-w-2xl text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
            Votre page de réservation, prête aujourd&apos;hui.
          </h2>
          <p className="mt-5 max-w-lg text-lg text-white/60">
            Gratuit pour commencer. Sans carte bancaire. En français, de A à Z.
          </p>
          <Button
            asChild
            size="lg"
            className={`mt-10 bg-white text-[#0a0a0c] hover:bg-white/90 ${pill}`}
          >
            <Link href="/inscription">Commencer gratuitement</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
