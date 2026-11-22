import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckCircle2, CircleAlert, ExternalLink } from "lucide-react";
import { SettingsSection, UpgradeNotice } from "@/components/settings/section";
import { Skeleton } from "@/components/ui/skeleton";
import { depositAllowed, type DepositMode } from "@/domain/billing/deposit";
import { requirePermission } from "@/server/auth/session";
import { isBillingConfigured } from "@/server/billing/stripe";
import { refreshConnectStatus } from "@/server/deposit/connect";
import { ConnectButton, DepositForm, DisconnectButton } from "./payments-client";

export const metadata: Metadata = { title: "Acompte et paiements — Paramètres" };

async function Content({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requirePermission("billing.manage");
  const sp = await searchParams;
  const o = ctx.organization;
  let ready = o.stripeAccountReady;
  if (o.stripeAccountId && (sp.stripe === "retour" || !ready)) {
    try {
      ready = await refreshConnectStatus(ctx);
    } catch (error) {
      console.error("[connect] état du compte indisponible", error);
    }
  }
  const allowed = depositAllowed(ctx.plan.id);

  return (
    <div className="grid gap-8">
      <SettingsSection
        title="Compte Stripe"
        description="Les acomptes sont versés directement sur votre propre compte Stripe, puis sur votre compte bancaire. BookSync ne prélève aucune commission ; seuls les frais de Stripe s'appliquent (environ 1,5 % + 0,25 € par paiement par carte européenne)."
      >
        {!allowed ? (
          <UpgradeNotice feature="L'acompte en ligne" plan="Starter" />
        ) : !isBillingConfigured() ? (
          <p className="text-sm text-muted-foreground">
            Le paiement en ligne n&apos;est pas encore disponible sur BookSync.
          </p>
        ) : !o.stripeAccountId ? (
          <div className="grid gap-4">
            <p className="text-sm">
              Connectez votre compte Stripe pour demander un acompte à la réservation.
              L&apos;inscription (identité, IBAN) se fait sur le site sécurisé de Stripe et prend
              environ 5 minutes. Si vous avez déjà un compte Stripe, vous pourrez l&apos;utiliser.
            </p>
            <div>
              <ConnectButton label="Connecter mon compte Stripe" />
            </div>
          </div>
        ) : ready ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm font-medium" data-testid="stripe-ready">
              <CheckCircle2 className="size-5 text-success" /> Compte Stripe connecté : prêt à
              recevoir les acomptes
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://dashboard.stripe.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm font-medium hover:bg-subtle"
              >
                Tableau de bord Stripe <ExternalLink className="size-3.5" />
              </a>
              <DisconnectButton />
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="flex items-start gap-2 text-sm">
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
              Votre inscription Stripe n&apos;est pas terminée (ou en cours de vérification par
              Stripe). Terminez-la pour recevoir des acomptes.
            </p>
            <div className="flex flex-wrap gap-2">
              <ConnectButton label="Terminer l'inscription Stripe" />
              <DisconnectButton />
            </div>
          </div>
        )}
      </SettingsSection>

      {allowed && ready ? (
        <SettingsSection
          title="Acompte"
          description="Réduisez les rendez-vous non honorés : le client paie une partie du prix en ligne pour confirmer sa réservation. Le reste se règle sur place."
        >
          <DepositForm
            initial={{ mode: o.depositMode as DepositMode, value: o.depositValue }}
            cancellationNoticeHours={o.cancellationNoticeHours}
          />
        </SettingsSection>
      ) : null}
    </div>
  );
}

export default function PaymentsSettingsPage(
  props: PageProps<"/tableau-de-bord/parametres/paiements">,
) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content searchParams={props.searchParams} />
    </Suspense>
  );
}
