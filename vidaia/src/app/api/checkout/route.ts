import { findPack } from "@/lib/packs";
import { stripe } from "@/server/account";
import { env } from "@/server/env";

/** Crée la session de paiement Stripe pour un pack, puis redirige vers Stripe. */
export async function POST(req: Request) {
  const form = await req.formData();
  const pack = findPack(form.get("pack"));
  const app = env().APP_URL;
  if (!pack || form.get("renonciation") !== "oui") return Response.redirect(`${app}/#tarifs`, 303);
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: pack.priceCents,
          product_data: { name: `VidaIA · Pack ${pack.name} (${pack.videos} vidéos)` },
        },
      },
    ],
    metadata: { pack: pack.id, renonciation: "oui" },
    success_url: `${app}/api/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${app}/?annule=1#tarifs`,
    locale: "fr",
  });
  return Response.redirect(session.url!, 303);
}
