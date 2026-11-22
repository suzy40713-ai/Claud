import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CalendarClock, CheckCircle2, MessageSquareOff, Star } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Stars } from "@/components/reviews/stars";
import { Skeleton } from "@/components/ui/skeleton";
import { getReviewView } from "@/server/reviews";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = {
  title: "Donner mon avis",
  robots: { index: false, follow: false },
};

async function Content({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  // Page dépendante de l'heure (avis possible après le rendez-vous) : jamais pré-rendue.
  await connection();
  const view = await getReviewView(token);
  if (!view) notFound();
  const note = Number((await searchParams).note);
  const initial = Number.isInteger(note) && note >= 1 && note <= 5 ? note : 0;

  const header = (
    <div className="border-b p-4 sm:p-5">
      <p className="font-semibold">{view.organizationName}</p>
      <p className="text-sm text-muted-foreground">
        {view.serviceName} · {view.dateLabel}
      </p>
    </div>
  );

  if (view.state === "open") {
    return (
      <>
        <div className="mb-6 text-center">
          <span className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Star className="size-7" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="review-title">
            Comment s&apos;est passé votre rendez-vous ?
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Bonjour {view.customerFirstName}, votre avis aide {view.organizationName} et les autres
            clients.
          </p>
        </div>
        <div className="rounded-2xl border bg-card shadow-sm">
          {header}
          <div className="p-4 sm:p-5">
            <ReviewForm token={token} initialRating={initial} />
          </div>
        </div>
      </>
    );
  }

  const done = view.state === "done";
  const Icon = done ? CheckCircle2 : view.state === "too_early" ? CalendarClock : MessageSquareOff;
  const message = {
    done: "Merci, votre avis est publié.",
    too_early: "Vous pourrez donner votre avis après votre rendez-vous.",
    closed: "Le délai pour donner un avis sur ce rendez-vous est dépassé.",
    unavailable: "Ce rendez-vous ne peut pas recevoir d'avis.",
  }[view.state];
  return (
    <div className="rounded-2xl border bg-card text-center shadow-sm">
      {header}
      <div className="grid justify-items-center gap-3 p-6">
        <Icon className={done ? "size-10 text-success" : "size-10 text-muted-foreground"} />
        <h1 className="text-xl font-semibold" data-testid="review-title">
          {message}
        </h1>
        {done && view.rating ? <Stars value={view.rating} className="text-2xl" /> : null}
        <Link href={`/${view.slug}`} className="text-sm font-semibold text-primary hover:underline">
          Voir la page de {view.organizationName} →
        </Link>
      </div>
    </div>
  );
}

export default function ReviewPage(props: PageProps<"/avis/[token]">) {
  return (
    <div className="min-h-dvh bg-subtle px-4 pt-10 pb-16">
      <div className="mx-auto w-full max-w-lg">
        <Suspense fallback={<Skeleton className="h-[460px]" />}>
          <Content params={props.params} searchParams={props.searchParams} />
        </Suspense>
        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          Propulsé par <Logo className="scale-75 [&>span:last-child]:text-sm" />
        </p>
      </div>
    </div>
  );
}
