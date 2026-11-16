import "server-only";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { organization } from "@/db/schema";
import {
  depositAllowed,
  MAX_FIXED_DEPOSIT_CENTS,
  MIN_DEPOSIT_CENTS,
} from "@/domain/billing/deposit";
import { assertCan } from "@/domain/permissions";
import { env } from "@/lib/env";
import type { OrgContext } from "@/server/auth/session";
import { ensureStripeSetup, getStripe } from "@/server/billing/stripe";
import { UserError } from "@/server/errors";

function requireStripe(stripe: Stripe | null = getStripe()) {
  if (!stripe) throw new UserError("Le paiement en ligne n'est pas encore configuré sur BookSync.");
  return stripe;
}

/** Recopie l'état d'un compte Stripe connecté (peut-il encaisser ?) sur l'entreprise. */
export async function syncConnectedAccount(account: Pick<Stripe.Account, "id" | "charges_enabled">) {
  const ready = Boolean(account.charges_enabled);
  await db
    .update(organization)
    .set({ stripeAccountReady: ready })
    .where(eq(organization.stripeAccountId, account.id));
}

/**
 * Connexion du compte Stripe du professionnel (Stripe Connect, compte avec tableau de bord Stripe
 * complet, frais Stripe payés par le professionnel) : aucun frais Connect pour BookSync.
 * Renvoie l'URL de l'inscription Stripe (identité, IBAN), hébergée par Stripe.
 */
export async function startConnectOnboarding(ctx: OrgContext, stripe = getStripe()) {
  assertCan(ctx.role, "billing.manage");
  const client = requireStripe(stripe);
  if (!depositAllowed(ctx.plan.id))
    throw new UserError("L'acompte en ligne est inclus à partir du forfait Starter.");
  await ensureStripeSetup();
  const org = ctx.organization;
  let accountId = org.stripeAccountId;
  if (!accountId) {
    try {
      const account = await client.accounts.create(
        {
          country: "FR",
          email: org.email ?? ctx.user.email,
          business_profile: {
            name: org.name,
            url: `${env.NEXT_PUBLIC_APP_URL}/${org.slug}`,
          },
          controller: {
            stripe_dashboard: { type: "full" },
            fees: { payer: "account" },
            losses: { payments: "stripe" },
            requirement_collection: "stripe",
          },
          metadata: { organizationId: org.id },
        },
        { idempotencyKey: `connect-account-${org.id}` },
      );
      accountId = account.id;
    } catch (error) {
      console.error("[connect] création du compte impossible", error);
      throw new UserError(
        "Stripe n'a pas pu créer votre compte de paiement. Réessayez dans quelques minutes ou contactez le support BookSync.",
      );
    }
    await db
      .update(organization)
      .set({ stripeAccountId: accountId, stripeAccountReady: false })
      .where(eq(organization.id, org.id));
  }
  const base = `${env.NEXT_PUBLIC_APP_URL}/tableau-de-bord/parametres/paiements`;
  const link = await client.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${base}?stripe=reprendre`,
    return_url: `${base}?stripe=retour`,
  });
  return link.url;
}

/** Au retour de Stripe : état du compte vérifié immédiatement. */
export async function refreshConnectStatus(ctx: OrgContext, stripe = getStripe()) {
  const id = ctx.organization.stripeAccountId;
  if (!id || !stripe) return ctx.organization.stripeAccountReady;
  const account = await stripe.accounts.retrieve(id);
  await syncConnectedAccount(account);
  return Boolean(account.charges_enabled);
}

/** Lien vers le tableau de bord Stripe du professionnel (virements, remboursements, relevés). */
export function stripeDashboardUrl() {
  return "https://dashboard.stripe.com/";
}

export const depositSettingsSchema = z
  .object({
    mode: z.enum(["none", "fixed", "percent"]),
    /** Euros (montant fixe) ou pourcentage. */
    value: z.coerce.number().min(0).max(10_000),
  })
  .superRefine((v, c) => {
    if (v.mode === "percent" && (!Number.isInteger(v.value) || v.value < 5 || v.value > 100))
      c.addIssue({ code: "custom", path: ["value"], message: "Entre 5 et 100 %." });
    if (
      v.mode === "fixed" &&
      (v.value * 100 < MIN_DEPOSIT_CENTS || v.value * 100 > MAX_FIXED_DEPOSIT_CENTS)
    )
      c.addIssue({ code: "custom", path: ["value"], message: "Entre 0,50 € et 1 000 €." });
  });

export async function updateDepositSettings(
  ctx: OrgContext,
  input: z.input<typeof depositSettingsSchema>,
) {
  assertCan(ctx.role, "billing.manage");
  const data = depositSettingsSchema.parse(input);
  if (data.mode !== "none") {
    if (!depositAllowed(ctx.plan.id))
      throw new UserError("L'acompte en ligne est inclus à partir du forfait Starter.");
    if (!ctx.organization.stripeAccountId || !ctx.organization.stripeAccountReady)
      throw new UserError("Connectez d'abord votre compte Stripe pour recevoir les acomptes.");
  }
  await db
    .update(organization)
    .set({
      depositMode: data.mode,
      depositValue:
        data.mode === "fixed" ? Math.round(data.value * 100) : data.mode === "percent" ? data.value : 0,
    })
    .where(eq(organization.id, ctx.organization.id));
}

/** Déconnexion : plus aucun acompte demandé (les acomptes déjà payés restent sur le compte Stripe). */
export async function disconnectStripeAccount(ctx: OrgContext) {
  assertCan(ctx.role, "billing.manage");
  await db
    .update(organization)
    .set({ stripeAccountId: null, stripeAccountReady: false, depositMode: "none", depositValue: 0 })
    .where(eq(organization.id, ctx.organization.id));
}
