import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { logError } from "@/lib/errors";
import { getStripe, syncSubscription } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe n'est pas configuré." }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    await logError("stripe:webhook:signature", error);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  // Idempotency: Stripe may deliver the same event several times.
  const { error: dupError } = await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dupError) {
    if (dupError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    await logError("stripe:webhook:idempotency", dupError);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          await syncSubscription(await stripe.subscriptions.retrieve(subId));
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await logError("stripe:payment_failed", new Error(`Payment failed for invoice ${invoice.id}`), null, {
          customer: invoice.customer,
        });
        break;
      }
      default:
        break;
    }
  } catch (error) {
    // Let Stripe retry: remove the idempotency marker.
    await admin.from("stripe_events").delete().eq("id", event.id);
    await logError(`stripe:webhook:${event.type}`, error);
    return NextResponse.json({ error: "Erreur de traitement." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
