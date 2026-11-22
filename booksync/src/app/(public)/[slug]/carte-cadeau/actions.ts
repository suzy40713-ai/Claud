"use server";

import { headers } from "next/headers";
import { getOrgBySlug } from "@/server/booking/public";
import { getStripe } from "@/server/billing/stripe";
import { runAction, UserError } from "@/server/errors";
import { createGiftCardCheckout } from "@/server/gift-cards";
import { clientIp, rateLimit } from "@/server/rate-limit";

export type GiftPurchaseInput = {
  amountCents: number;
  buyerName: string;
  buyerEmail: string;
  recipientName: string;
  message?: string;
  /** Champ piège invisible : rempli uniquement par les robots. */
  website?: string;
};

/** Achat d'une carte cadeau : renvoie l'adresse de la page de paiement Stripe du salon. */
export async function buyGiftCardAction(slug: string, input: GiftPurchaseInput) {
  return runAction(async () => {
    if (input.website) throw new UserError("Achat refusé.");
    const ip = clientIp(await headers());
    if (!rateLimit(`gift:${ip}`, 8, 10 * 60_000))
      throw new UserError("Trop de tentatives depuis cette connexion. Réessayez plus tard.");
    const org = await getOrgBySlug(slug);
    if (!org) throw new UserError("Établissement introuvable.");
    const { website: _ignored, ...data } = input;
    void _ignored;
    return createGiftCardCheckout(getStripe(), org, data);
  });
}
