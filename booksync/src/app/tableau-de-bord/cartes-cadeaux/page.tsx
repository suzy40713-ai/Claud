import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
import { SettingsSection, UpgradeNotice } from "@/components/settings/section";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { euros, giftCardsAllowed, giftCardState } from "@/domain/billing/gift-card";
import { can } from "@/domain/permissions";
import { capitalize, formatInTz } from "@/lib/format";
import { env } from "@/lib/env";
import { requirePermission } from "@/server/auth/session";
import { listGiftCards } from "@/server/gift-cards";
import { GiftSettingsForm, RedeemPanel } from "./gift-client";

export const metadata: Metadata = { title: "Cartes cadeaux" };

const STATE_BADGE = {
  active: { label: "Utilisable", variant: "success" },
  used: { label: "Utilisée", variant: "neutral" },
  expired: { label: "Expirée", variant: "warning" },
  pending: { label: "Paiement en attente", variant: "outline" },
} as const;

async function Content() {
  const ctx = await requirePermission("appointments.manage_own");
  const o = ctx.organization;
  const tz = o.timezone;
  const isManager = can(ctx.role, "billing.manage");
  const canList = can(ctx.role, "customers.view_all");
  const cards = canList ? await listGiftCards(ctx) : [];
  const paid = cards.filter((c) => c.status === "active");
  const soldCents = paid.reduce((s, c) => s + c.amountCents, 0);
  const outstandingCents = paid.reduce(
    (s, c) => s + (giftCardState(c) === "active" ? c.balanceCents : 0),
    0,
  );
  const allowed = giftCardsAllowed(ctx.plan.id);
  const stripeReady = Boolean(o.stripeAccountId && o.stripeAccountReady);
  const publicUrl = `${env.NEXT_PUBLIC_APP_URL}/${o.slug}/carte-cadeau`;

  return (
    <div className="grid gap-8">
      <SettingsSection
        title="Utiliser une carte au salon"
        description="La cliente présente son code : vérifiez le solde et déduisez le montant de sa prestation."
      >
        <RedeemPanel timeZone={tz} />
      </SettingsSection>

      {isManager ? (
        <SettingsSection
          title="Vente en ligne"
          description="Vos clients achètent une carte depuis votre page de réservation. L'argent arrive directement sur votre compte Stripe, BookSync ne prend aucune commission (seuls les frais Stripe s'appliquent)."
        >
          {!allowed ? (
            <UpgradeNotice feature="Les cartes cadeaux" plan="Starter" />
          ) : !stripeReady ? (
            <div className="grid gap-3 text-sm">
              <p>
                Pour encaisser les cartes cadeaux, connectez d&apos;abord votre compte Stripe (le
                même que pour l&apos;acompte).
              </p>
              <div>
                <Link
                  href="/tableau-de-bord/parametres/paiements"
                  className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  Connecter mon compte Stripe
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              <GiftSettingsForm
                initial={{ enabled: o.giftCardsEnabled, amounts: o.giftCardAmounts }}
              />
              {o.giftCardsEnabled ? (
                <div className="flex flex-col gap-2 rounded-lg border bg-subtle p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 truncate">
                    Lien à partager (Instagram, WhatsApp…) :{" "}
                    <span className="font-medium">{publicUrl}</span>
                  </span>
                  <CopyButton value={publicUrl} />
                </div>
              ) : null}
            </div>
          )}
        </SettingsSection>
      ) : null}

      {canList ? (
        <section className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Cartes vendues" value={String(paid.length)} />
            <StatCard label="Montant encaissé" value={euros(soldCents)} />
            <StatCard label="Reste à utiliser" value={euros(outstandingCents)} />
          </div>
          {cards.length === 0 ? (
            <EmptyState
              icon={<Gift />}
              title="Aucune carte cadeau vendue"
              description="Activez la vente en ligne et partagez votre lien : Noël, anniversaires et fête des mères sont les meilleurs moments."
            />
          ) : (
            <ul className="grid gap-2" data-testid="gift-list">
              {cards.map((c) => {
                const st = giftCardState(c);
                return (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border bg-card p-3 text-sm shadow-xs"
                  >
                    <span className="font-mono font-semibold">{c.code}</span>
                    <Badge variant={STATE_BADGE[st].variant}>{STATE_BADGE[st].label}</Badge>
                    <span>
                      {euros(c.amountCents)}
                      {st === "active" && c.balanceCents !== c.amountCents
                        ? ` · reste ${euros(c.balanceCents)}`
                        : ""}
                    </span>
                    <span className="text-muted-foreground">
                      pour {c.recipientName}, offerte par {c.buyerName} ·{" "}
                      {capitalize(formatInTz(c.paidAt ?? c.createdAt, tz, "d MMM yyyy"))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

export default function GiftCardsPage() {
  return (
    <>
      <PageHeader
        title="Cartes cadeaux"
        description="Vendez des cartes cadeaux en ligne et encaissez avant même la venue de la cliente."
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Content />
      </Suspense>
    </>
  );
}
