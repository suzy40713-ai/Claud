"use server";

import { revalidatePath } from "next/cache";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { PLANS } from "@/lib/config/plans";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export interface BillingActionResult {
  success: boolean;
  url?: string;
  devMode?: boolean;
  error?: string;
}

/**
 * Starts an upgrade to Pro. With Stripe configured, creates a real Checkout
 * Session and returns its URL for the client to redirect to. Without keys
 * configured, upgrades the profile directly so the whole app (credits,
 * feature gates) remains testable end-to-end in local/dev environments —
 * per spec §20 ("mode développement" when Stripe isn't set up yet).
 */
export async function startProUpgrade(): Promise<BillingActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { success: false, error: "Tu dois être connecté(e)." };
  }

  if (!isStripeConfigured()) {
    const admin = createAdminClient();
    await admin.from("profiles").update({ plan: "pro" }).eq("id", user.id);
    await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan: "pro",
        status: "active",
        current_period_end: null,
        cancel_at_period_end: false,
      },
      { onConflict: "user_id" }
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/parametres");
    return { success: true, devMode: true };
  }

  const stripe = getStripe()!;
  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single();

  let customerId = profile?.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: PLANS.pro.stripePriceId, quantity: 1 }],
    success_url: `${getAppUrl()}/dashboard/parametres?tab=abonnement&checkout=success`,
    cancel_url: `${getAppUrl()}/dashboard/parametres?tab=abonnement&checkout=cancelled`,
    metadata: { supabase_user_id: user.id },
  });

  if (!session.url) {
    return { success: false, error: "Impossible de créer la session de paiement." };
  }

  return { success: true, url: session.url };
}

/**
 * Opens the Stripe customer portal so users manage/cancel their own
 * subscription. In dev mode (no Stripe keys), downgrades locally instead.
 */
export async function openBillingPortal(): Promise<BillingActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu dois être connecté(e)." };
  }

  if (!isStripeConfigured()) {
    const admin = createAdminClient();
    await admin.from("profiles").update({ plan: "free" }).eq("id", user.id);
    await admin.from("subscriptions").upsert(
      { user_id: user.id, plan: "free", status: "canceled", cancel_at_period_end: false },
      { onConflict: "user_id" }
    );
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/parametres");
    return { success: true, devMode: true };
  }

  const stripe = getStripe()!;
  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single();

  if (!profile?.stripe_customer_id) {
    return { success: false, error: "Aucun abonnement Stripe actif." };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${getAppUrl()}/dashboard/parametres?tab=abonnement`,
  });

  return { success: true, url: session.url };
}
