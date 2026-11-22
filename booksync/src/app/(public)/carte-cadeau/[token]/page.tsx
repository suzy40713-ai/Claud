import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CheckCircle2, Clock, Gift } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Alert } from "@/components/ui/alert";
import { CopyButton } from "@/components/ui/copy-button";
import { Skeleton } from "@/components/ui/skeleton";
import { euros, giftCardState } from "@/domain/billing/gift-card";
import { verifyGiftCardToken } from "@/lib/manage-token";
import { getStripe } from "@/server/billing/stripe";
import { formatDate, getGiftCardView, syncGiftCardReturn } from "@/server/gift-cards";
import { PrintButton } from "./print-button";

export const metadata: Metadata = {
  title: "Carte cadeau",
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
  // Solde et validité changent dans le temps : page jamais pré-rendue.
  await connection();
  const id = verifyGiftCardToken(token);
  if (!id) notFound();
  if ((await searchParams).paiement === "ok") {
    await syncGiftCardReturn(getStripe(), id).catch((error) =>
      console.error("[carte cadeau] vérification du paiement impossible", id, error),
    );
  }
  const view = await getGiftCardView(id);
  if (!view) notFound();
  const { card, org } = view;
  const state = giftCardState(card);
  const color = org.brandColor ?? "#3563E9";

  if (state === "pending") {
    return (
      <div
        className="rounded-2xl border bg-card p-6 text-center shadow-sm"
        data-testid="gift-pending"
      >
        <Clock className="mx-auto mb-3 size-9 text-muted-foreground" />
        <h1 className="text-lg font-semibold">Paiement en cours de confirmation</h1>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Dès que le paiement est confirmé, la carte s&apos;affiche ici et vous la recevez par
          email. Rechargez la page dans quelques instants.
        </p>
      </div>
    );
  }

  return (
    <>
      {(await searchParams).paiement === "ok" ? (
        <Alert variant="success" className="mb-5 print:hidden">
          Merci ! Le paiement est confirmé. Imprimez la carte ou transférez ce lien.
        </Alert>
      ) : null}
      <article
        className="overflow-hidden rounded-3xl text-white shadow-xl print:shadow-none"
        style={{ background: `linear-gradient(135deg, ${color}, #101828)` }}
        data-testid="gift-card"
      >
        <div className="p-7 sm:p-9">
          <p className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Gift className="size-4" /> Carte cadeau
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{org.name}</p>
          <p className="mt-6 text-6xl font-semibold tracking-tighter" data-testid="gift-amount">
            {euros(card.amountCents)}
          </p>
          <p className="mt-6 text-lg">
            Pour <strong>{card.recipientName}</strong>
          </p>
          {card.message ? (
            <p className="mt-2 text-[15px] whitespace-pre-line text-white/85 italic">
              « {card.message} »
            </p>
          ) : null}
          <p className="mt-1 text-sm text-white/70">De la part de {card.buyerName}</p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 bg-black/25 px-7 py-5 sm:px-9">
          <div>
            <p className="text-xs tracking-wide text-white/60 uppercase">Code</p>
            <p className="font-mono text-2xl font-bold tracking-[0.2em]" data-testid="gift-code">
              {card.code}
            </p>
          </div>
          <p className="text-sm text-white/75">
            Valable jusqu&apos;au {formatDate(card.expiresAt!, org.timezone)}
          </p>
        </div>
      </article>

      <div className="mt-5 rounded-2xl border bg-card p-5 text-sm shadow-sm print:border-0 print:shadow-none">
        {state === "active" ? (
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4 text-success" /> Solde disponible :{" "}
            {euros(card.balanceCents)}
          </p>
        ) : (
          <p className="font-medium text-muted-foreground">
            {state === "used" ? "Cette carte a été entièrement utilisée." : "Cette carte a expiré."}
          </p>
        )}
        <p className="mt-2 text-muted-foreground">
          Présentez ce code au salon : le montant est déduit de votre prestation.
          {org.phone ? ` Téléphone du salon : ${org.phone}.` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <Link
            href={`/${org.slug}`}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Réserver chez {org.name}
          </Link>
          <PrintButton />
          <CopyButton value={card.code} label="Copier le code" />
        </div>
      </div>
    </>
  );
}

export default function GiftCardPage(props: PageProps<"/carte-cadeau/[token]">) {
  return (
    <div className="min-h-dvh bg-subtle px-4 pt-8 pb-16 print:bg-white">
      <div className="mx-auto w-full max-w-lg">
        <Suspense fallback={<Skeleton className="h-[480px]" />}>
          <Content params={props.params} searchParams={props.searchParams} />
        </Suspense>
        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground print:hidden">
          Propulsé par <Logo className="scale-75 [&>span:last-child]:text-sm" />
        </p>
      </div>
    </div>
  );
}
