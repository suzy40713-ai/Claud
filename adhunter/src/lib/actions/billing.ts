"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAccountOrThrow, type Account } from "@/lib/account";
import { appUrl } from "@/lib/env";
import { UserFacingError, toActionError, type ActionResult } from "@/lib/errors";
import { getStripe, priceIdForPlan, syncSubscription } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

const paidPlan = z.enum(["pro", "business"]);

function requireStripe() {
  const stripe = getStripe();
  if (!stripe) {
    throw new UserFacingError("Les paiements sont en préparation : Stripe n'est pas encore configuré sur cette instance.", "not_configured");
  }
  return stripe;
}

async function getOrCreateCustomer(account: Account) {
  const stripe = requireStripe();
  if (account.subscription?.stripe_customer_id) return account.subscription.stripe_customer_id;
  const customer = await stripe.customers.create({
    email: account.user.email,
    name: account.profile.full_name ?? undefined,
    metadata: { supabase_user_id: account.user.id },
  });
  const { error } = await createAdminClient()
    .from("subscriptions")
    .upsert({ user_id: account.user.id, stripe_customer_id: customer.id, plan: "free", status: "inactive", source: "stripe" });
  if (error) throw error;
  return customer.id;
}

function hasLiveStripeSubscription(account: Account) {
  const s = account.subscription;
  return Boolean(s?.stripe_subscription_id && s.source === "stripe" && ["active", "trialing", "past_due"].includes(s.status));
}

/**
 * Starts a Stripe Checkout for a paid plan. `waiver` = the consumer's express
 * request that the service starts before the end of the 14-day withdrawal
 * period (Code de la consommation, L221-25); if they withdraw, they owe a
 * pro-rata amount for the service already provided.
 */
export async function startCheckout(plan: string, waiver: boolean): Promise<ActionResult<{ url: string }>> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const target = paidPlan.parse(plan);
    if (!waiver) {
      throw new UserFacingError("Merci de cocher la case de demande d'exécution immédiate pour continuer.");
    }
    if (hasLiveStripeSubscription(account)) {
      throw new UserFacingError("Tu as déjà un abonnement actif : utilise « Changer de formule ».");
    }
    const stripe = requireStripe();
    const price = await priceIdForPlan(target);
    if (!price) throw new UserFacingError("Cette formule n'est pas encore disponible à l'achat.", "not_configured");
    const customer = await getOrCreateCustomer(account);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price, quantity: 1 }],
      client_reference_id: account.user.id,
      metadata: { supabase_user_id: account.user.id, plan: target, withdrawal_waiver: "accepted" },
      subscription_data: { metadata: { supabase_user_id: account.user.id, plan: target } },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      tax_id_collection: { enabled: true },
      customer_update: { address: "auto", name: "auto" },
      ...(process.env.STRIPE_AUTOMATIC_TAX === "true" ? { automatic_tax: { enabled: true } } : {}),
      locale: "fr",
      success_url: `${appUrl()}/app/billing?checkout=success`,
      cancel_url: `${appUrl()}/app/billing?checkout=canceled`,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { ok: true, data: { url: session.url } };
  } catch (error) {
    return toActionError("startCheckout", error, userId);
  }
}

export async function changePlan(plan: string): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const target = paidPlan.parse(plan);
    if (!hasLiveStripeSubscription(account)) throw new UserFacingError("Aucun abonnement actif à modifier.");
    if (account.subscription!.plan === target) throw new UserFacingError("Tu es déjà sur cette formule.");
    const stripe = requireStripe();
    const price = await priceIdForPlan(target);
    if (!price) throw new UserFacingError("Cette formule n'est pas encore disponible.", "not_configured");

    const current = await stripe.subscriptions.retrieve(account.subscription!.stripe_subscription_id!);
    const item = current.items.data[0];
    const updated = await stripe.subscriptions.update(current.id, {
      items: [{ id: item.id, price }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
      metadata: { ...current.metadata, supabase_user_id: account.user.id, plan: target },
    });
    await syncSubscription(updated);
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (error) {
    return toActionError("changePlan", error, userId);
  }
}

/** Cancels at period end — access stays until the paid period is over. */
export async function cancelSubscription(): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    if (!hasLiveStripeSubscription(account)) throw new UserFacingError("Aucun abonnement actif à résilier.");
    const stripe = requireStripe();
    const updated = await stripe.subscriptions.update(account.subscription!.stripe_subscription_id!, { cancel_at_period_end: true });
    await syncSubscription(updated);
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (error) {
    return toActionError("cancelSubscription", error, userId);
  }
}

export async function resumeSubscription(): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    if (!hasLiveStripeSubscription(account)) throw new UserFacingError("Aucun abonnement à réactiver.");
    const stripe = requireStripe();
    const updated = await stripe.subscriptions.update(account.subscription!.stripe_subscription_id!, { cancel_at_period_end: false });
    await syncSubscription(updated);
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (error) {
    return toActionError("resumeSubscription", error, userId);
  }
}

/** Stripe Customer Portal: payment methods, invoices, billing details. */
export async function openBillingPortal(): Promise<ActionResult<{ url: string }>> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const stripe = requireStripe();
    if (!account.subscription?.stripe_customer_id) throw new UserFacingError("Aucun compte de facturation pour le moment.");
    const session = await stripe.billingPortal.sessions.create({
      customer: account.subscription.stripe_customer_id,
      return_url: `${appUrl()}/app/billing`,
      locale: "fr",
    });
    return { ok: true, data: { url: session.url } };
  } catch (error) {
    return toActionError("openBillingPortal", error, userId);
  }
}
