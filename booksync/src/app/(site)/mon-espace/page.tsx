import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarCheck2, CalendarX2, MapPin, Search, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { capitalize, formatCents, formatDateLong, formatInTz, formatTime } from "@/lib/format";
import { listMemberships, requireSession } from "@/server/auth/session";
import { listMyAppointments, type MyAppointment } from "@/server/customer-space";

export const metadata: Metadata = {
  title: "Mes rendez-vous",
  robots: { index: false, follow: false },
};

const STATUS = {
  pending_payment: { label: "Acompte en attente", variant: "warning" },
  confirmed: { label: "Confirmé", variant: "success" },
  cancelled: { label: "Annulé", variant: "neutral" },
  completed: { label: "Honoré", variant: "neutral" },
  no_show: { label: "Absent", variant: "warning" },
} as const;

function AppointmentCard({ a, past }: { a: MyAppointment; past?: boolean }) {
  const tz = a.orgTimezone;
  const address = [a.orgAddress, [a.orgPostalCode, a.orgCity].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  return (
    <li
      className="grid gap-3 rounded-2xl border bg-card p-4 shadow-xs sm:p-5"
      data-testid="my-appointment"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{a.orgName}</p>
          <p className="text-sm text-muted-foreground">
            {a.serviceName} · avec {a.staffName}
          </p>
        </div>
        <Badge variant={STATUS[a.status].variant} className="shrink-0">
          {STATUS[a.status].label}
        </Badge>
      </div>
      <p
        className={`text-[15px] font-medium ${a.status === "cancelled" ? "text-muted-foreground line-through" : ""}`}
      >
        {past
          ? capitalize(formatInTz(a.startsAt, tz, "EEE d MMM yyyy 'à' HH:mm"))
          : `${capitalize(formatDateLong(a.startsAt, tz))} à ${formatTime(a.startsAt, tz)}`}
        {a.priceCents ? (
          <span className="font-normal text-muted-foreground"> · {formatCents(a.priceCents)}</span>
        ) : null}
      </p>
      {address && !past ? (
        <p className="flex items-start gap-1.5 text-[13px] text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" /> {address}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {!past && a.status === "confirmed" ? (
          <Button asChild size="sm" variant="secondary">
            <Link href={`/rdv/${a.manageToken}`}>Modifier ou annuler</Link>
          </Button>
        ) : null}
        <Button asChild size="sm" variant="ghost">
          <Link href={`/${a.orgSlug}`}>
            {past || a.status !== "confirmed" ? "Reprendre rendez-vous" : "Voir l'établissement"}
          </Link>
        </Button>
      </div>
    </li>
  );
}

async function Content() {
  const session = await requireSession();
  if (!session.user.termsAcceptedAt) redirect("/accepter-conditions?redirection=/mon-espace");
  const [{ upcoming, past }, memberships] = await Promise.all([
    listMyAppointments(session.user),
    listMemberships(session.user.id),
  ]);
  const firstName = session.user.name.split(/\s+/)[0];
  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            Bonjour {firstName}
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Tous vos rendez-vous pris sur BookSync, chez tous les professionnels.
          </p>
        </div>
        <Button asChild>
          <Link href="/professionnels">
            <Search /> Trouver un professionnel
          </Link>
        </Button>
      </div>

      {!session.user.emailVerified ? (
        <p className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          Confirmez votre adresse email pour retrouver vos rendez-vous ici.
        </p>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-[15px] font-semibold">
          À venir <span className="text-muted-foreground">({upcoming.length})</span>
        </h2>
        {upcoming.length ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {upcoming.map((a) => (
              <AppointmentCard key={a.id} a={a} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
            <CalendarCheck2 className="mb-3 size-8 text-muted-foreground" />
            <p className="font-semibold">Aucun rendez-vous à venir</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Les rendez-vous pris avec votre adresse {session.user.email} apparaissent ici
              automatiquement.
            </p>
            <Button asChild className="mt-4">
              <Link href="/professionnels">Prendre rendez-vous</Link>
            </Button>
          </div>
        )}
      </section>

      {past.length ? (
        <section className="grid gap-3">
          <h2 className="text-[15px] font-semibold">Historique</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {past.map((a) => (
              <AppointmentCard key={a.id} a={a} past />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-3 rounded-2xl border bg-subtle p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Store className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold">
              {memberships.length ? "Votre espace professionnel" : "Vous êtes un professionnel ?"}
            </p>
            <p className="text-sm text-muted-foreground">
              {memberships.length
                ? `Gérez l'agenda de ${memberships[0].organizationName}.`
                : "Créez votre page de réservation et gérez vos rendez-vous gratuitement."}
            </p>
          </div>
        </div>
        <Button asChild variant="secondary" className="shrink-0">
          <Link href={memberships.length ? "/tableau-de-bord" : "/onboarding"}>
            {memberships.length ? "Ouvrir le tableau de bord" : "Créer mon établissement"}
            <ArrowRight />
          </Link>
        </Button>
      </section>
      <p className="text-xs text-muted-foreground">
        <CalendarX2 className="mr-1 inline size-3.5" />
        Les modifications et annulations suivent les conditions de chaque professionnel.
      </p>
    </div>
  );
}

export default function MySpacePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content />
      </Suspense>
    </main>
  );
}
