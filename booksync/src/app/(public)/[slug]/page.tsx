import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BellRing, CalendarX2, Clock, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { describeDay, WEEKDAYS } from "@/domain/schedule/hours";
import { getPublicBookingPage } from "@/server/booking/public";
import { BookingFlow } from "./booking-flow";

export async function generateMetadata(props: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = await getPublicBookingPage(slug);
  if (!page) return { title: "Page introuvable" };
  return {
    title: `Réserver — ${page.organization.name}`,
    description:
      page.organization.description ??
      `Prenez rendez-vous en ligne avec ${page.organization.name}.`,
  };
}

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublicBookingPage(slug);
  if (!page) notFound();
  const o = page.organization;
  const brand = o.brandColor ?? undefined;

  return (
    <div
      className="min-h-dvh bg-subtle"
      style={
        brand
          ? ({
              "--primary": brand,
              "--ring": brand,
              "--primary-hover": brand,
            } as React.CSSProperties)
          : undefined
      }
    >
      {o.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={o.coverUrl} alt="" className="h-36 w-full object-cover sm:h-56" />
      ) : (
        <div
          className="h-20 bg-gradient-to-b from-primary-soft to-transparent sm:h-28"
          style={
            brand
              ? { background: `linear-gradient(to bottom, ${brand}26, transparent)` }
              : undefined
          }
        />
      )}
      <div className="mx-auto -mt-10 grid w-full max-w-5xl gap-6 px-4 pb-16 sm:-mt-14 sm:px-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-2xl border bg-card p-5 shadow-sm lg:sticky lg:top-6">
          <div className="flex items-center gap-3 lg:flex-col lg:items-start">
            {o.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={o.logoUrl}
                alt={`Logo ${o.name}`}
                className="size-14 rounded-xl border bg-white object-contain p-1"
              />
            ) : (
              <span className="flex size-14 items-center justify-center rounded-xl bg-primary text-xl font-semibold text-primary-foreground">
                {o.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight">{o.name}</h1>
              <p className="text-sm text-muted-foreground">Réservation en ligne</p>
            </div>
          </div>
          {o.welcomeMessage || o.description ? (
            <p className="mt-4 text-sm whitespace-pre-line text-muted-foreground">
              {o.welcomeMessage ?? o.description}
            </p>
          ) : null}
          <ul className="mt-4 grid gap-2 text-sm">
            {o.address ? (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <a
                  className="hover:underline"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address)}`}
                >
                  {o.address}
                </a>
              </li>
            ) : null}
            {o.phone ? (
              <li className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <a className="hover:underline" href={`tel:${o.phone.replace(/\s/g, "")}`}>
                  {o.phone}
                </a>
              </li>
            ) : null}
          </ul>
          <details className="group mt-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
              <Clock className="size-4 text-muted-foreground" /> Horaires d&apos;ouverture
            </summary>
            <dl className="mt-3 grid grid-cols-[90px_1fr] gap-y-1 text-[13px]">
              {WEEKDAYS.map((d) => (
                <div key={d.value} className="contents">
                  <dt className="text-muted-foreground">{d.label}</dt>
                  <dd>{describeDay(page.hours[d.value] ?? [])}</dd>
                </div>
              ))}
            </dl>
          </details>
        </aside>

        <main className="min-w-0">
          {!o.bookingEnabled || page.services.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border bg-card px-6 py-14 text-center shadow-sm">
              <CalendarX2 className="mb-4 size-8 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Réservation en ligne indisponible</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {o.phone
                  ? `Contactez l'établissement au ${o.phone} pour prendre rendez-vous.`
                  : "Contactez directement l'établissement pour prendre rendez-vous."}
              </p>
            </div>
          ) : (
            <BookingFlow page={page} />
          )}
          {page.waitlistEnabled && page.services.length ? (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  <BellRing className="size-4 text-primary" aria-hidden /> Aucun créneau ne vous
                  convient ?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Inscrivez-vous sur la liste d&apos;attente : nous vous prévenons par email dès
                  qu&apos;un créneau se libère.
                </p>
              </div>
              <Link
                href={`/${o.slug}/liste-attente`}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border bg-card px-4 text-sm font-semibold hover:bg-subtle"
              >
                Rejoindre la liste d&apos;attente
              </Link>
            </div>
          ) : null}
          <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            Propulsé par <Logo className="scale-75 [&>span:last-child]:text-sm" />
          </p>
        </main>
      </div>
    </div>
  );
}

export default function PublicBookingPage(props: PageProps<"/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-24">
          <Skeleton className="h-96" />
        </div>
      }
    >
      <Content params={props.params} />
    </Suspense>
  );
}
