import { CheckCircle2, FileText } from "lucide-react";

import { CancelOrResume, ChangePlanButton, CheckoutButton, PortalButton } from "@/components/billing/billing-actions";
import { PlanCard } from "@/components/billing/plan-card";
import { NotConfigured, PageHeader, UsageBar } from "@/components/app/ui-bits";
import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { getPlans, getUsage, requireAccount } from "@/lib/account";
import { integrations } from "@/lib/env";
import { logError } from "@/lib/errors";
import { PLAN_ORDER, nextPeriodStart, planRank } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata = { title: "Abonnement" };

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  trialing: "Période d'essai",
  past_due: "Paiement en retard",
  canceled: "Résilié",
  incomplete: "Paiement incomplet",
  incomplete_expired: "Expiré",
  unpaid: "Impayé",
  paused: "En pause",
  inactive: "Aucun abonnement",
};

async function getInvoices(customerId: string | null | undefined) {
  const stripe = getStripe();
  if (!stripe || !customerId) return [];
  try {
    const list = await stripe.invoices.list({ customer: customerId, limit: 12 });
    return list.data;
  } catch (error) {
    await logError("billing:invoices", error);
    return [];
  }
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string; plan?: string }> }) {
  const account = await requireAccount("/app/billing");
  const sp = await searchParams;
  const [plans, usage, invoices] = await Promise.all([getPlans(), getUsage(account), getInvoices(account.subscription?.stripe_customer_id)]);
  const stripeReady = integrations.stripe();
  const sub = account.subscription;
  const hasStripeSub = Boolean(sub?.stripe_subscription_id && sub.source === "stripe" && ["active", "trialing", "past_due"].includes(sub.status));
  const manual = sub?.source === "manual" && account.planId !== "free";

  return (
    <div className="space-y-8">
      <PageHeader title="Abonnement" description="Gère ta formule, ton moyen de paiement et tes factures." />
      {sp.checkout === "success" && (
        <FormMessage type="success">Merci ! Ton paiement est confirmé. L'activation peut prendre quelques secondes — actualise la page si ta formule n'est pas encore à jour.</FormMessage>
      )}
      {sp.checkout === "canceled" && <FormMessage type="info">Paiement annulé : aucun montant n'a été débité.</FormMessage>}
      {!stripeReady && (
        <NotConfigured title="Paiements en préparation">
          Stripe n'est pas encore configuré sur cette instance (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET et les identifiants de prix). Les abonnements payants seront disponibles dès la configuration.
        </NotConfigured>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="surface space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Formule actuelle</p>
              <p className="mt-1 text-2xl font-semibold">{account.plan.name} <span className="text-base font-normal text-muted-foreground">· {formatPrice(account.plan.priceCents)} / mois</span></p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {account.planId === "free" ? "Gratuit" : STATUS_LABELS[sub?.status ?? "inactive"]}
            </span>
          </div>
          {hasStripeSub && sub?.current_period_end && (
            <p className="text-sm text-muted-foreground">
              {sub.cancel_at_period_end ? `Résiliation programmée : accès jusqu'au ${formatDate(sub.current_period_end)}.` : `Prochain renouvellement le ${formatDate(sub.current_period_end)}.`}
            </p>
          )}
          {manual && <p className="text-sm text-muted-foreground">Formule attribuée par l'équipe AdHunter{sub?.current_period_end ? ` jusqu'au ${formatDate(sub.current_period_end)}` : ""}.</p>}
          <div className="flex flex-wrap gap-2">
            {hasStripeSub && <CancelOrResume canceling={Boolean(sub?.cancel_at_period_end)} periodEnd={sub?.current_period_end ?? null} />}
            {stripeReady && sub?.stripe_customer_id && <PortalButton />}
          </div>
        </section>
        <section className="surface space-y-4 p-6">
          <p className="text-sm font-medium">Utilisation ce mois-ci</p>
          <UsageBar label="Recherches" used={usage.counts.search} limit={usage.limits.search} />
          <UsageBar label="Analyses IA" used={usage.counts.analysis} limit={usage.limits.analysis} />
          <UsageBar label="Ad Creator" used={usage.counts.creation} limit={usage.limits.creation} />
          <UsageBar label="Exports" used={usage.counts.export} limit={usage.limits.export} />
          <p className="text-xs text-muted-foreground">Prochaine réinitialisation : {formatDate(nextPeriodStart())}.</p>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Changer de formule</h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const plan = plans[id];
            const current = account.planId === id;
            let action: React.ReactNode;
            if (current) action = <Button variant="secondary" className="w-full" disabled>Formule actuelle</Button>;
            else if (id === "free") {
              action = hasStripeSub ? <p className="text-center text-xs text-muted-foreground">Pour revenir à Free, résilie ton abonnement ci-dessus.</p> : <Button variant="outline" className="w-full" disabled>Inclus</Button>;
            } else if (hasStripeSub) {
              action = <ChangePlanButton plan={id} planName={plan.name} upgrade={planRank(id) > planRank(account.planId)} />;
            } else if (manual) {
              action = <Button variant="outline" className="w-full" disabled>Formule attribuée manuellement</Button>;
            } else {
              action = <CheckoutButton plan={id} planName={plan.name} priceCents={plan.priceCents} disabled={!stripeReady} autoOpen={sp.plan === id && !sp.checkout} />;
            }
            return <PlanCard key={id} plan={plan} current={current} highlighted={id === "pro" && !current} action={action} />;
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Factures</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune facture pour le moment.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-card text-left text-xs text-muted-foreground">
                <tr><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Numéro</th><th className="p-3 font-medium">Montant</th><th className="p-3 font-medium">Statut</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-border">
                    <td className="p-3">{formatDate(new Date(inv.created * 1000))}</td>
                    <td className="p-3 font-mono text-xs">{inv.number ?? "—"}</td>
                    <td className="p-3">{formatPrice(inv.total, inv.currency.toUpperCase())}</td>
                    <td className="p-3">{inv.status === "paid" ? "Payée" : inv.status === "open" ? "À payer" : inv.status ?? "—"}</td>
                    <td className="p-3 text-right">
                      {inv.hosted_invoice_url && (
                        <a href={inv.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-violet-400 hover:underline">
                          <FileText className="h-3.5 w-3.5" /> Voir
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
