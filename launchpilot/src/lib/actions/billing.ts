"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/client";
import { grantCredits, CREDITS_PER_PURCHASE } from "@/lib/credits";

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
 * Buys one plan generation for 14,99€ (one-time payment, no subscription).
 * With Stripe configured, creates a real Checkout Session in `payment` mode
 * and returns its URL for the client to redirect to; the credit is granted
 * by the webhook once Stripe confirms payment. Without keys configured,
 * grants the credit directly so the whole app stays testable end-to-end in
 * local/dev environments (per spec: functional dev-mode architecture).
 */
export async function purchasePlanCredit(returnTo?: string): Promise<BillingActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { success: false, error: "Tu dois être connecté(e)." };
  }

  if (!isStripeConfigured()) {
    await grantCredits(user.id, CREDITS_PER_PURCHASE);
    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
    revalidatePath("/generating");
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

  const redirectPath = returnTo && returnTo.startsWith("/") ? returnTo : "/dashboard";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID_PLAN, quantity: 1 }],
    success_url: `${getAppUrl()}${redirectPath}?purchase=success`,
    cancel_url: `${getAppUrl()}${redirectPath}?purchase=cancelled`,
    metadata: { supabase_user_id: user.id, credits: String(CREDITS_PER_PURCHASE) },
  });

  if (!session.url) {
    return { success: false, error: "Impossible de créer la session de paiement." };
  }

  return { success: true, url: session.url };
}
