import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CalendarCheck2, CalendarX2, Clock3 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { capitalize, formatCents, formatDateLong, formatDateTime, formatDuration, formatTime } from "@/lib/format";
import { getAppointmentByToken } from "@/server/booking/manage";
import { ManageActions } from "./manage-actions";

export const metadata: Metadata = { title: "Mon rendez-vous", robots: { index: false, follow: false } };

async function Content({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ nouveau?: string }> }) {
  const [{ token }, { nouveau }] = await Promise.all([params, searchParams]);
  const data = await getAppointmentByToken(token);
  if (!data) notFound();
  const { appt, org, cust } = data;
  const tz = org.timezone;
  const cancelled = appt.status === "cancelled";
  const past = appt.startsAt < new Date();
  const address = [org.addressLine1, [org.postalCode, org.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  return (
    <>
      <div className="mb-6 text-center">
        <span
          className={`mb-4 inline-flex size-14 items-center justify-center rounded-2xl ${cancelled ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success"}`}
        >
          {cancelled ? <CalendarX2 className="size-7" /> : past ? <Clock3 className="size-7" /> : <CalendarCheck2 className="size-7" />}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="manage-title">
          {cancelled ? "Rendez-vous annulé" : nouveau ? "Rendez-vous confirmé !" : past ? "Rendez-vous passé" : "Votre rendez-vous"}
        </h1>
        {nouveau && !cancelled ? (
          <p className="mt-2 text-[15px] text-muted-foreground">
            Merci {cust.firstName}.{" "}
            {cust.email ? "Un récapitulatif vous est envoyé par email si l'établissement a activé les notifications." : ""}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b p-4 sm:p-5">
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logoUrl} alt="" className="size-11 rounded-lg border bg-white object-contain p-0.5" />
          ) : (
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">{org.name.charAt(0)}</span>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">{org.name}</p>
            {address ? <p className="truncate text-[13px] text-muted-foreground">{address}</p> : null}
          </div>
        </div>
        <dl className="grid gap-3 p-4 text-sm sm:p-5">
          {[
            ["Prestation", appt.serviceName],
            ["Date", capitalize(formatDateLong(appt.startsAt, tz))],
            ["Heure", `${formatTime(appt.startsAt, tz)} · ${formatDuration(Math.round((appt.endsAt.getTime() - appt.startsAt.getTime()) / 60000))}`],
            ["Avec", data.staffName],
            ...(appt.priceCents ? [["Prix", `${formatCents(appt.priceCents)} — à régler sur place`]] : []),
            ...(org.phone ? [["Téléphone", org.phone]] : []),
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[100px_1fr] gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className={`font-medium ${cancelled ? "line-through decoration-muted-foreground/60" : ""}`}>{v}</dd>
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
          <Content params={props.params} searchParams={props.searchParams as Promise<{ nouveau?: string }>} />
        </Suspense>
        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          Propulsé par <Logo className="scale-75 [&>span:last-child]:text-sm" />
        </p>
      </div>
    </div>
  );
}
