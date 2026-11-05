import type { Metadata } from "next";
import { Suspense } from "react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAN_ORDER, PLANS } from "@/domain/billing/plans";
import { formatCents, formatInTz } from "@/lib/format";
import { requirePermission } from "@/server/auth/session";
import { getMonthlyUsage } from "@/server/booking/book";
import { confirmCheckout, listInvoices } from "@/server/billing/service";
import { isBillingConfigured } from "@/server/billing/stripe";
import { countSeats } from "@/server/team/service";
import { BillingActions, PlanButton } from "./billing-actions";

export const metadata: Metadata = { title: "Abonnement" };

const STATUS: Record<string, string> = {
  active: "Actif",
  trialing: "Période d'essai",
  past_due: "Paiement en retard",
  unpaid: "Impayé",
  canceled: "Résilié",
  incomplete: "Paiement incomplet",
  incomplete_expired: "Expiré",
  paused: "En pause",
};
const INVOICE_STATUS: Record<string, string> = {
  paid: "Payée",
  open: "À payer",
  void: "Annulée",
  uncollectible: "Irrécouvrable",
  draft: "Brouillon",
};

async function Content({
  searchParams,
}: {
  searchParams: Promise<{ paiement?: string; session?: string }>;
}) {
  const sp = await searchParams;
  let ctx = await requirePermission("billing.manage");
  if (sp.paiement === "succes" && sp.session) {
    await confirmCheckout(ctx, sp.session).catch((e) => console.error("[stripe] confirmation", e));
    ctx = await requirePermission("billing.manage");
  }
  const tz = ctx.organization.timezone;
  const [invoices, usage, seats] = await Promise.all([
    listInvoices(ctx),
    getMonthlyUsage(ctx.organization.id, tz),
    countSeats(ctx.organization.id),
  ]);
  const o = ctx.organization;
  const configured = isBillingConfigured();
  const current = ctx.plan;

  return (
    <div className="grid gap-6">
      {sp.paiement === "succes" ? (
        <Alert variant="success">
          Merci ! Votre paiement a été accepté. Votre forfait est actif.
        </Alert>
      ) : null}
      {sp.paiement === "annule" ? (
        <Alert>Paiement annulé : aucun montant n&apos;a été prélevé.</Alert>
      ) : null}
      {!configured ? (
        <Alert variant="error">
          La facturation Stripe n&apos;est pas encore configurée sur ce serveur (clés et prix
          manquants). Les changements de forfait sont indisponibles.
        </Alert>
      ) : null}
      {o.subscriptionStatus === "past_due" || o.subscriptionStatus === "unpaid" ? (
        <Alert variant="error">
          Le dernier paiement a échoué. Mettez à jour votre moyen de paiement pour conserver votre
          forfait.
        </Alert>
      ) : null}

      <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Forfait actuel</p>
          <p
            className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight"
            data-testid="current-plan"
          >
            {current.name}
            {o.subscriptionStatus ? (
              <Badge variant={o.subscriptionStatus === "active" ? "success" : "warning"}>
                {STATUS[o.subscriptionStatus] ?? o.subscriptionStatus}
              </Badge>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {current.priceCents ? `${formatCents(current.priceCents)} TTC par mois` : "Gratuit"}
            {o.currentPeriodEnd && current.id !== "free"
              ? o.cancelAtPeriodEnd
                ? ` · se termine le ${formatInTz(o.currentPeriodEnd, tz, "d MMMM yyyy")}`
                : ` · renouvellement le ${formatInTz(o.currentPeriodEnd, tz, "d MMMM yyyy")}`
              : ""}
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Ce mois-ci : {usage} réservation{usage > 1 ? "s" : ""}
            {current.limits.bookingsPerMonth
              ? ` sur ${current.limits.bookingsPerMonth}`
              : ""} · {seats.used} membre{seats.used > 1 ? "s" : ""} sur {current.limits.members}
          </p>
        </div>
        {configured ? (
          <BillingActions
            hasSubscription={Boolean(o.stripeSubscriptionId)}
            cancelAtPeriodEnd={o.cancelAtPeriodEnd}
            hasCustomer={Boolean(o.stripeCustomerId)}
          />
        ) : null}
      </section>

      <section aria-labelledby="plans-title">
        <h2 id="plans-title" className="mb-3 text-[15px] font-semibold">
          Changer d&apos;offre
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const p = PLANS[id];
            const isCurrent = id === current.id;
            return (
              <div
                key={id}
                className={`flex flex-col rounded-xl border bg-card p-5 ${id === "pro" ? "ring-1 ring-primary/30" : ""}`}
                data-testid={`plan-${id}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  {isCurrent ? (
                    <Badge variant="primary">Actuel</Badge>
                  ) : id === "pro" ? (
                    <Badge variant="outline">Le plus complet</Badge>
                  ) : null}
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {p.priceCents ? formatCents(p.priceCents) : "0 €"}
                  <span className="text-sm font-normal text-muted-foreground"> /mois TTC</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                <ul className="mt-4 grid flex-1 gap-1.5 text-sm">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="text-primary">✓</span> {h}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  {isCurrent ? null : id === "free" ? (
                    o.stripeSubscriptionId && !o.cancelAtPeriodEnd ? (
                      <p className="text-[13px] text-muted-foreground">
                        Pour revenir au forfait Free, résiliez votre abonnement ci-dessus.
                      </p>
                    ) : null
                  ) : (
                    <PlanButton
                      plan={id}
                      label={
                        o.stripeSubscriptionId ? `Passer au forfait ${p.name}` : `Choisir ${p.name}`
                      }
                      disabled={!configured}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[13px] text-muted-foreground">
          Paiement sécurisé par Stripe. Changement d&apos;offre immédiat, calculé au prorata.
          Résiliation possible à tout moment, effective à la fin de la période payée. En repassant
          sur Free, aucune donnée n&apos;est supprimée.
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border bg-card">
        <h2 className="border-b px-4 py-3 text-[15px] font-semibold sm:px-5">
          Historique des paiements
        </h2>
        {invoices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-subtle text-left text-[12px] text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium sm:px-5">Date</th>
                  <th className="px-4 py-2.5 font-medium">Facture</th>
                  <th className="px-4 py-2.5 text-right font-medium">Montant</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2.5 sm:px-5">
                      {formatInTz(i.issuedAt, tz, "d MMM yyyy")}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{i.number ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatCents(i.status === "paid" ? i.amountPaidCents : i.amountDueCents)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={
                          i.status === "paid"
                            ? "success"
                            : i.status === "open"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {INVOICE_STATUS[i.status] ?? i.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {i.invoicePdfUrl ? (
                        <a
                          href={i.invoicePdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          PDF
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Aucun paiement pour l&apos;instant.
          </p>
        )}
      </section>
    </div>
  );
}

export default function BillingPage(props: PageProps<"/tableau-de-bord/abonnement">) {
  return (
    <>
      <PageHeader
        title="Abonnement"
        description="Votre forfait BookSync, vos paiements et vos factures."
      />
      <Suspense fallback={<Skeleton className="h-[600px]" />}>
        <Content
          searchParams={props.searchParams as Promise<{ paiement?: string; session?: string }>}
        />
      </Suspense>
    </>
  );
}
