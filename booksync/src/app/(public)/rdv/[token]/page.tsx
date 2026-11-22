import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalendarCheck2, CalendarX2, Clock3, CreditCard } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import {
  capitalize,
  formatCents,
  formatDateLong,
  formatDateTime,
  formatDuration,
  formatTime,
} from "@/lib/format";
import { getStripe } from "@/server/billing/stripe";
import { getAppointmentByToken } from "@/server/booking/manage";
import { syncDepositReturn } from "@/server/deposit/payment";
import { DepositActions } from "./deposit-actions";
import { ManageActions } from "./manage-actions";

type Data = NonNullable<Awaited<ReturnType<typeof getAppointmentByToken>>>;

function priceLine(appt: Data["appt"]) {
  const price = formatCents(appt.priceCents);
  const dep = formatCents(appt.depositCents);
  switch (appt.depositStatus) {
    case "paid":
      return `${price} — acompte de ${dep} payé en ligne, reste ${formatCents(appt.priceCents - appt.depositCents)} à régler sur place`;
    case "refunded":
      return `${price} — acompte de ${dep} remboursé`;
    case "refund_failed":
      return `${price} — remboursement de l'acompte de ${dep} en cours de traitement par l'établissement`;
    default:
      return `${price} — à régler sur place`;
  }
}

/** Réservation en attente du paiement de l'acompte. */
function PendingPayment({
  data,
  token,
  returned,
}: {
  data: Data;
  token: string;
  returned?: string;
}) {
  const { appt, org } = data;
  const tz = org.timezone;
  return (
    <>
      <div className="mb-6 text-center">
        <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <CreditCard className="size-7" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="manage-title">
          {returned === "ok"
            ? "Paiement en cours de vérification"
            : "Acompte en attente de paiement"}
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {returned === "ok"
            ? "Votre paiement est en cours de validation par Stripe. Actualisez la page dans quelques secondes."
            : `Votre créneau est réservé quelques minutes : payez l'acompte de ${formatCents(appt.depositCents)} pour confirmer le rendez-vous.`}
        </p>
      </div>
      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="border-b p-4 font-semibold sm:p-5">{org.name}</div>
        <dl className="grid gap-3 p-4 text-sm sm:p-5">
          {[
            ["Prestation", appt.serviceName],
            ["Date", capitalize(formatDateLong(appt.startsAt, tz))],
            ["Heure", formatTime(appt.startsAt, tz)],
            ["Acompte", formatCents(appt.depositCents)],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[100px_1fr] gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="border-t p-4 sm:p-5">
          <DepositActions token={token} bookingUrl={`/${org.slug}`} />
        </div>
      </div>
    </>
  );
}

export const metadata: Metadata = {
  title: "Mon rendez-vous",
  robots: { index: false, follow: false },
};

async function Content({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ nouveau?: string; acompte?: string }>;
}) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  let data = await getAppointmentByToken(token);
  if (!data) notFound();
  // Retour de la page de paiement Stripe : confirmation immédiate si l'acompte est payé.
  if (sp.acompte === "ok" && data.appt.status === "pending_payment") {
    try {
      await syncDepositReturn(getStripe(), data.appt.id);
      data = (await getAppointmentByToken(token)) ?? data;
    } catch (error) {
      console.error("[acompte] vérification du paiement impossible", error);
    }
  }
  const nouveau = sp.nouveau ?? (sp.acompte === "ok" ? "1" : undefined);
  if (data.appt.status === "pending_payment")
    return <PendingPayment data={data} token={token} returned={sp.acompte} />;
  const { appt, org, cust } = data;
  const tz = org.timezone;
  const cancelled = appt.status === "cancelled";
  const past = appt.startsAt < new Date();
  const address = [org.addressLine1, [org.postalCode, org.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="mb-6 text-center">
        <span
          className={`mb-4 inline-flex size-14 items-center justify-center rounded-2xl ${cancelled ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success"}`}
        >
          {cancelled ? (
            <CalendarX2 className="size-7" />
          ) : past ? (
            <Clock3 className="size-7" />
          ) : (
            <CalendarCheck2 className="size-7" />
          )}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="manage-title">
          {cancelled
            ? "Rendez-vous annulé"
            : nouveau
              ? "Rendez-vous confirmé !"
              : past
                ? "Rendez-vous passé"
                : "Votre rendez-vous"}
        </h1>
        {nouveau && !cancelled ? (
          <p className="mt-2 text-[15px] text-muted-foreground">
            Merci {cust.firstName}.{" "}
            {cust.email
              ? "Un récapitulatif vous est envoyé par email si l'établissement a activé les notifications."
              : ""}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b p-4 sm:p-5">
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logoUrl}
              alt=""
              className="size-11 rounded-lg border bg-white object-contain p-0.5"
            />
          ) : (
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
              {org.name.charAt(0)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">{org.name}</p>
            {address ? (
              <p className="truncate text-[13px] text-muted-foreground">{address}</p>
            ) : null}
          </div>
        </div>
        <dl className="grid gap-3 p-4 text-sm sm:p-5">
          {[
            ["Prestation", appt.serviceName],
            ["Date", capitalize(formatDateLong(appt.startsAt, tz))],
            [
              "Heure",
              `${formatTime(appt.startsAt, tz)} · ${formatDuration(Math.round((appt.endsAt.getTime() - appt.startsAt.getTime()) / 60000))}`,
            ],
            ["Avec", data.staffName],
            ...(appt.priceCents ? [["Prix", priceLine(appt)]] : []),
            ...(org.phone ? [["Téléphone", org.phone]] : []),
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[100px_1fr] gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd
                className={`font-medium ${cancelled ? "line-through decoration-muted-foreground/60" : ""}`}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <div className="border-t p-4 sm:p-5">
          <ManageActions
            token={token}
            timeZone={tz}
            canChange={data.canChange}
            cancelled={cancelled}
            past={past}
            deadlineLabel={formatDateTime(data.deadline, tz)}
            bookingUrl={`/${org.slug}`}
          />
        </div>
      </div>
    </>
  );
}

export default function ManagePage(props: PageProps<"/rdv/[token]">) {
  return (
    <div className="min-h-dvh bg-subtle px-4 pt-10 pb-16">
      <div className="mx-auto w-full max-w-lg">
        <Suspense fallback={<Skeleton className="h-[480px]" />}>
          <Content
            params={props.params}
            searchParams={props.searchParams as Promise<{ nouveau?: string; acompte?: string }>}
          />
        </Suspense>
        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          Propulsé par <Logo className="scale-75 [&>span:last-child]:text-sm" />
        </p>
      </div>
    </div>
  );
}
