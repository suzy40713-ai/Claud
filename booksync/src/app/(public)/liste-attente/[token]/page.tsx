import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck2, CalendarClock, CalendarX2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { getOfferView } from "@/server/waitlist/service";
import { AcceptButton } from "./accept-button";

export const metadata: Metadata = {
  title: "Créneau disponible",
  robots: { index: false, follow: false },
};

const TITLES = {
  pending: "Un créneau s'est libéré pour vous",
  accepted: "Ce créneau est réservé pour vous",
  expired: "Cette proposition a expiré",
  taken: "Ce créneau a déjà été réservé",
} as const;

async function Content({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const offer = await getOfferView(token);
  if (!offer) notFound();
  const Icon =
    offer.status === "pending"
      ? CalendarClock
      : offer.status === "accepted"
        ? CalendarCheck2
        : CalendarX2;
  return (
    <>
      <div className="mb-6 text-center">
        <span
          className={`mb-4 inline-flex size-14 items-center justify-center rounded-2xl ${offer.status === "pending" || offer.status === "accepted" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}
        >
          <Icon className="size-7" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="offer-title">
          {TITLES[offer.status]}
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {offer.status === "pending"
            ? `Bonjour ${offer.customerFirstName}, vous étiez sur la liste d'attente de ${offer.organizationName}. Le premier client qui confirme obtient le créneau.`
            : offer.status === "accepted"
              ? "Votre rendez-vous est confirmé."
              : "Vous restez inscrit sur la liste d'attente : nous vous préviendrons si un autre créneau se libère."}
        </p>
      </div>
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-4 font-semibold sm:p-5">{offer.organizationName}</div>
        <dl className="grid gap-3 p-4 text-sm sm:p-5">
          {[
            ["Prestation", offer.serviceName],
            ["Date", offer.dateLabel],
            ["Heure", `${offer.timeLabel} · ${offer.durationLabel}`],
            ["Avec", offer.staffName],
            ...(offer.priceLabel ? [["Prix", `${offer.priceLabel} — à régler sur place`]] : []),
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[100px_1fr] gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-3 border-t p-4 sm:p-5">
          {offer.status === "pending" ? (
            <>
              <AcceptButton token={token} />
              <p className="text-center text-[13px] text-muted-foreground">
                Proposition valable jusqu&apos;au {offer.expiresLabel}.
              </p>
            </>
          ) : offer.status === "accepted" && offer.manageToken ? (
            <Link
              href={`/rdv/${offer.manageToken}`}
              className="text-center text-sm font-semibold text-primary hover:underline"
            >
              Voir mon rendez-vous →
            </Link>
          ) : (
            <Link
              href={`/${offer.slug}`}
              className="text-center text-sm font-semibold text-primary hover:underline"
            >
              Voir les autres créneaux disponibles →
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

export default function OfferPage(props: PageProps<"/liste-attente/[token]">) {
  return (
    <div className="min-h-dvh bg-subtle px-4 pt-10 pb-16">
      <div className="mx-auto w-full max-w-lg">
        <Suspense fallback={<Skeleton className="h-[420px]" />}>
          <Content params={props.params} />
        </Suspense>
        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          Propulsé par <Logo className="scale-75 [&>span:last-child]:text-sm" />
        </p>
      </div>
    </div>
  );
}
