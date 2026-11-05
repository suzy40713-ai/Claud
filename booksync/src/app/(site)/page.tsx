import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  BellRing,
  CalendarCheck2,
  CalendarDays,
  Check,
  Clock4,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_ORDER, PLANS, formatPrice } from "@/domain/billing/plans";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name} — ${site.tagline}` },
  description: site.description,
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

const FAQ = [
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

export default function LandingPage() {
  return (
    <main className="overflow-x-clip">
      {/* Hero */}
      <section className="relative isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(55%_55%_at_50%_0%,var(--primary-soft),transparent)]"
        />
        <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 pt-14 pb-20 sm:px-6 sm:pt-24 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div className="animate-fade-up text-center lg:text-left">
            <Badge variant="primary" className="mb-5">
              <Sparkles className="size-3" /> Logiciel de prise de rendez-vous
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Vos rendez-vous, <span className="text-primary">parfaitement organisés.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-pretty text-muted-foreground lg:mx-0">
              BookSync réunit votre page de réservation en ligne, l&apos;agenda de votre équipe et
              les rappels clients dans un outil simple et élégant.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button asChild size="lg">
                <Link href="/inscription">Commencer gratuitement</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/#tarifs">Voir les tarifs</Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
              {["Sans carte bancaire", "Prêt en 5 minutes", "Paiement sur place"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-success" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* Public cible */}
      <section className="border-y bg-subtle">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-center text-sm font-medium text-muted-foreground">
            Conçu pour les professionnels qui travaillent sur rendez-vous
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {AUDIENCE.map((a) => (
              <li key={a} className="rounded-full border bg-card px-3 py-1 text-sm">
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Présentation */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
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
            <div key={n}>
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white dark:bg-primary">
                {n}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-[15px] text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="scroll-mt-20 bg-subtle py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Tout ce qu&apos;il faut, rien de superflu
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les outils essentiels pour remplir votre agenda et réduire les rendez-vous manqués.
            </p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl border bg-card p-6 shadow-xs">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Avantages */}
      <section id="avantages" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Fiable, rapide, sécurisé
            </h2>
            <p className="mt-3 text-muted-foreground">
              BookSync a été conçu pour que vous n&apos;ayez jamais à vous soucier de votre agenda.
            </p>
            <Button asChild className="mt-6">
              <Link href="/inscription">Créer mon compte gratuit</Link>
            </Button>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl border p-5">
                <Icon className="size-5 text-primary" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="scroll-mt-20 bg-subtle py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Des tarifs simples
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sans engagement. Prix TTC par mois. Vos clients paient sur place.
            </p>
          </div>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {PLAN_ORDER.map((id) => {
              const p = PLANS[id];
              const featured = id === "starter";
              return (
                <div
                  key={id}
                  className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-xs ${featured ? "ring-2 ring-primary" : ""}`}
                >
                  {featured ? (
                    <Badge variant="primary" className="absolute -top-2.5 left-6">
                      Le plus choisi
                    </Badge>
                  ) : null}
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                  <p className="mt-5 text-4xl font-semibold tracking-tight">
                    {p.priceCents ? formatPrice(p.priceCents) : "0 €"}
                    <span className="text-sm font-normal text-muted-foreground"> /mois</span>
                  </p>
                  <ul className="mt-6 grid flex-1 gap-2.5 text-sm">
                    {p.highlights.map((h) => (
                      <li key={h} className="flex gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {h}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-8 w-full"
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
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Commencez sur Free, passez à un forfait payant quand vous le souhaitez depuis votre
            espace.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Questions fréquentes
        </h2>
        <div className="mt-10 divide-y rounded-2xl border bg-card">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <span className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-[15px] text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center rounded-3xl bg-navy px-6 py-14 text-center text-white">
          <CalendarCheck2 className="size-10 text-[#8fb0ff]" />
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Votre page de réservation, prête aujourd&apos;hui.
          </h2>
          <p className="mt-3 max-w-lg text-white/70">
            Gratuit pour commencer. Sans carte bancaire. En français, de A à Z.
          </p>
          <Button asChild size="lg" className="mt-8 bg-white text-navy hover:bg-white/90">
            <Link href="/inscription">Commencer gratuitement</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
