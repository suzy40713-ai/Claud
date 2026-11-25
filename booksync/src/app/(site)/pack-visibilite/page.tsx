import { BOOKING_ENABLED } from "@/lib/features";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck2, Check, Clapperboard, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PUBLISHER } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Pack visibilité salon — 99 €",
  description:
    "Fiche Google Maps optimisée, page de réservation en ligne installée et 2 vidéos pour Instagram et TikTok : tout est fait pour vous, à distance, pour 99 €.",
  alternates: { canonical: "/pack-visibilite" },
};

/** Lien de paiement Stripe du pack (variable d'environnement ; sinon contact par email). */
const PAYMENT_URL = process.env.PACK_PAYMENT_URL;

const INCLUDED = [
  {
    icon: MapPin,
    title: "Votre fiche Google Maps",
    text: "Création ou amélioration de votre fiche Google : photos, horaires, catégories, description et lien de réservation. C'est là que les clients du quartier vous trouvent.",
  },
  {
    icon: CalendarCheck2,
    title: "Votre page de réservation installée",
    text: "Vos prestations, vos prix et vos horaires sont saisis pour vous. Vos clients réservent seuls, même le soir, avec un rappel automatique la veille.",
  },
  {
    icon: Clapperboard,
    title: "2 vidéos pour Instagram et TikTok",
    text: "Deux vidéos courtes et sous-titrées qui présentent votre salon et vos prestations, prêtes à publier.",
  },
];

const SCREENS = [
  {
    src: "/pack/10-page-note.jpg",
    title: "Votre page de réservation",
    text: "Vos prestations, vos prix et votre note.",
  },
  {
    src: "/pack/03-creneaux.jpg",
    title: "Vos clients choisissent un créneau",
    text: "24h/24, sans vous appeler.",
  },
  {
    src: "/pack/17-agenda.jpg",
    title: "Tout arrive dans votre agenda",
    text: "Sur votre téléphone, en temps réel.",
  },
  {
    src: "/pack/14-avis-publics.jpg",
    title: "Vos avis clients",
    text: "Avis vérifiés, demandés automatiquement.",
  },
];

const STEPS = [
  "Vous réglez 99 € en ligne, par paiement sécurisé.",
  "Vous m'envoyez par message vos prestations, vos prix, vos horaires et quelques photos.",
  "Je prépare tout sous 7 jours, sans que vous ayez à configurer quoi que ce soit.",
  "Vous validez : Google vous envoie un code de vérification pour votre fiche, et vous recevez vos vidéos.",
];

export default function PackPage() {
  if (!BOOKING_ENABLED) notFound();
  const mail = `mailto:${PUBLISHER.email}?subject=${encodeURIComponent("Pack visibilité salon")}`;
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="text-center">
        <p className="text-sm font-semibold text-primary">
          Pour les salons de coiffure, barbiers et instituts
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">
          Pack visibilité salon
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[17px] text-muted-foreground">
          Plus de clients grâce à Google, Instagram et la réservation en ligne. Tout est fait pour
          vous, à distance, par message.
        </p>
        <p className="mt-6 text-5xl font-semibold tracking-tight" data-testid="pack-price">
          99 €<span className="ml-2 text-base font-normal text-muted-foreground">en une fois</span>
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {PAYMENT_URL ? (
            <Button asChild size="lg">
              <a href={PAYMENT_URL} rel="noreferrer">
                Commander le pack — 99 €
              </a>
            </Button>
          ) : null}
          <Button asChild size="lg" variant={PAYMENT_URL ? "secondary" : "primary"}>
            <a href={mail}>
              <MessageCircle /> {PAYMENT_URL ? "Une question ?" : "Commander par email"}
            </a>
          </Button>
        </div>
      </div>

      <section className="mt-14" aria-labelledby="inclus">
        <h2 id="inclus" className="text-center text-2xl font-semibold tracking-tight">
          Ce qui est inclus
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {INCLUDED.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-2xl border bg-card p-5 shadow-xs">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="apercu">
        <h2 id="apercu" className="text-center text-2xl font-semibold tracking-tight">
          À quoi ça ressemble
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Captures du site avec un salon d&apos;exemple.
        </p>
        <ul
          className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0"
          data-testid="pack-screens"
        >
          {SCREENS.map((s) => (
            <li key={s.src} className="w-[62%] shrink-0 snap-center sm:w-auto">
              <div className="overflow-hidden rounded-[28px] border-[6px] border-foreground/90 bg-white shadow-md">
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
              <p className="mt-3 text-sm font-semibold">{s.title}</p>
              <p className="text-[13px] text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14" aria-labelledby="etapes">
        <h2 id="etapes" className="text-center text-2xl font-semibold tracking-tight">
          Comment ça se passe
        </h2>
        <ol className="mx-auto mt-6 grid max-w-2xl gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3 rounded-xl border bg-card p-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <span className="text-[15px]">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="mx-auto mt-14 max-w-2xl rounded-2xl bg-subtle p-5 sm:p-6"
        aria-labelledby="conditions"
      >
        <h2 id="conditions" className="font-semibold">
          Bon à savoir
        </h2>
        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
          {[
            "Paiement unique de 99 €, TVA non applicable (article 293 B du CGI). Offre réservée aux professionnels.",
            "Livraison sous 7 jours après réception de vos informations. Si le pack n'est pas livré dans ce délai, vous êtes remboursé intégralement sur simple demande.",
            "Votre fiche Google reste à vous : vous en êtes le propriétaire. Aucun classement dans Google n'est garanti, personne ne peut le promettre honnêtement.",
            "L'abonnement à la réservation en ligne est séparé et facultatif : 1er mois offert, puis 9,99 €/mois, sans engagement.",
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {t}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          Une question ?{" "}
          <a href={mail} className="font-medium text-primary hover:underline">
            {PUBLISHER.email}
          </a>{" "}
          ·{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Découvrir la réservation en ligne
          </Link>
        </p>
      </section>
    </main>
  );
}
