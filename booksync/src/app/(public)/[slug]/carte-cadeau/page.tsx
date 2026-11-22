import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Gift } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicBookingPage } from "@/server/booking/public";
import { GiftForm } from "./gift-form";

export const metadata: Metadata = {
  title: "Offrir une carte cadeau",
  robots: { index: false, follow: false },
};

async function Content({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const { paiement } = await searchParams;
  const page = await getPublicBookingPage(slug);
  if (!page || !page.giftCardAmounts.length) notFound();
  const o = page.organization;
  return (
    <>
      <Link
        href={`/${slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {o.name}
      </Link>
      <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <span className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Gift className="size-5" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">Offrir une carte cadeau</h1>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Une carte à utiliser chez {o.name}, valable 12 mois. Vous la recevez par email dès le
          paiement, à imprimer ou à transférer.
        </p>
        {paiement === "annule" ? (
          <Alert className="mb-5">Paiement annulé : aucune somme n&apos;a été prélevée.</Alert>
        ) : null}
        <GiftForm slug={slug} amounts={page.giftCardAmounts} />
      </div>
    </>
  );
}

export default function GiftCardBuyPage(props: PageProps<"/[slug]/carte-cadeau">) {
  return (
    <div className="min-h-dvh bg-subtle px-4 pt-8 pb-16">
      <div className="mx-auto w-full max-w-lg">
        <Suspense fallback={<Skeleton className="h-[640px]" />}>
          <Content params={props.params} searchParams={props.searchParams} />
        </Suspense>
        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          Propulsé par <Logo className="scale-75 [&>span:last-child]:text-sm" />
        </p>
      </div>
    </div>
  );
}
