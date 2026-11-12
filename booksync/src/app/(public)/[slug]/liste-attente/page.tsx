import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { addDays, localDateOf } from "@/domain/availability/engine";
import { getPublicBookingPage } from "@/server/booking/public";
import { JoinForm } from "./join-form";

export const metadata: Metadata = {
  title: "Liste d'attente",
  robots: { index: false, follow: false },
};

async function Content({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublicBookingPage(slug);
  if (!page || !page.waitlistEnabled || !page.services.length) notFound();
  const today = localDateOf(new Date(), page.organization.timezone);
  return (
    <>
      <Link
        href={`/${slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {page.organization.name}
      </Link>
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <h1 className="text-xl font-semibold tracking-tight">Liste d&apos;attente</h1>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Indiquez vos disponibilités. Si un rendez-vous est annulé chez {page.organization.name},
          le créneau vous est proposé par email.
        </p>
        <JoinForm
          slug={slug}
          services={page.services.map((s) => ({ id: s.id, name: s.name }))}
          staff={page.staff.map((s) => ({ id: s.id, name: s.name }))}
          today={today}
          maxDate={addDays(today, 90)}
        />
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Vos coordonnées servent uniquement à vous proposer un rendez-vous chez{" "}
        {page.organization.name}.
      </p>
    </>
  );
}

export default function WaitlistJoinPage(props: PageProps<"/[slug]/liste-attente">) {
  return (
    <div className="min-h-dvh bg-subtle px-4 pt-8 pb-16">
      <div className="mx-auto w-full max-w-lg">
        <Suspense fallback={<Skeleton className="h-[560px]" />}>
          <Content params={props.params} />
        </Suspense>
        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          Propulsé par <Logo className="scale-75 [&>span:last-child]:text-sm" />
        </p>
      </div>
    </div>
  );
}
