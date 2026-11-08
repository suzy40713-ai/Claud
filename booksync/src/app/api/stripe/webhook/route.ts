import { connection } from "next/server";
import { handleStripeEvent } from "@/server/billing/service";
import { getStripe, getWebhookSecret } from "@/server/billing/stripe";

/** Webhooks Stripe : signature vérifiée sur le corps brut, traitement idempotent. */
export async function POST(req: Request) {
  await connection();
  const stripe = getStripe();
  const secret = stripe ? await getWebhookSecret() : null;
  if (!stripe || !secret)
    return Response.json({ error: "Facturation non configurée" }, { status: 503 });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Signature manquante" }, { status: 400 });
  const payload = await req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch {
    return Response.json({ error: "Signature invalide" }, { status: 400 });
  }
  try {
    const processed = await handleStripeEvent(event, stripe);
    return Response.json({ received: true, duplicate: !processed });
  } catch (error) {
    console.error("[stripe] échec du traitement", event.type, event.id, error);
    return Response.json({ error: "Erreur de traitement" }, { status: 500 });
  }
}
