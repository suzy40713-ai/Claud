/**
 * Cartes cadeaux : règles métier pures (montants, code, solde), testées unitairement.
 * La carte est payée en ligne sur le compte Stripe du professionnel (Stripe Connect) :
 * l'argent lui est versé directement, BookSync ne prélève aucune commission.
 */
import { planIncludes } from "@/domain/autopilot/automations";
import type { PlanId } from "./plans";

/** Montant minimum et maximum d'une carte cadeau, en centimes. */
export const MIN_GIFT_CARD_CENTS = 1_000;
export const MAX_GIFT_CARD_CENTS = 50_000;
/** Montants proposés par défaut sur la page du salon. */
export const DEFAULT_GIFT_CARD_AMOUNTS = [3_000, 5_000, 10_000];
/** Nombre maximum de montants proposés. */
export const MAX_GIFT_CARD_AMOUNTS = 6;
/** Durée de validité d'une carte cadeau, en mois. */
export const GIFT_CARD_VALIDITY_MONTHS = 12;
/** Longueur maximale du petit mot accompagnant la carte. */
export const GIFT_MESSAGE_MAX = 300;
/** Forfait minimal pour vendre des cartes cadeaux (même règle que l'acompte). */
export const GIFT_CARD_MIN_PLAN: PlanId = "starter";

export function giftCardsAllowed(plan: PlanId) {
  return planIncludes(plan, GIFT_CARD_MIN_PLAN);
}

export function validGiftAmount(cents: number) {
  return (
    Number.isInteger(cents) &&
    cents >= MIN_GIFT_CARD_CENTS &&
    cents <= MAX_GIFT_CARD_CENTS &&
    cents % 100 === 0
  );
}

/**
 * Nettoie la liste des montants saisis par le professionnel : euros entiers, bornés,
 * sans doublon, triés. Retourne une erreur lisible si la liste est inutilisable.
 */
export function parseGiftAmounts(
  input: string,
): { ok: true; amounts: number[] } | { ok: false; error: string } {
  const parts = input
    .split(/[\s,;]+/)
    .map((p) => p.replace(/€/g, "").trim())
    .filter(Boolean);
  if (!parts.length) return { ok: false, error: "Indiquez au moins un montant." };
  const amounts: number[] = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return { ok: false, error: `« ${p} » n'est pas un montant en euros.` };
    const cents = Number(p) * 100;
    if (!validGiftAmount(cents))
      return {
        ok: false,
        error: `Chaque montant doit être compris entre ${MIN_GIFT_CARD_CENTS / 100} € et ${MAX_GIFT_CARD_CENTS / 100} €.`,
      };
    if (!amounts.includes(cents)) amounts.push(cents);
  }
  if (amounts.length > MAX_GIFT_CARD_AMOUNTS)
    return { ok: false, error: `${MAX_GIFT_CARD_AMOUNTS} montants au maximum.` };
  return { ok: true, amounts: amounts.sort((a, b) => a - b) };
}

/** Alphabet sans caractères ambigus (0/O, 1/I/L) : le code se lit et se tape sans erreur. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Code de carte au format XXXX-XXXX, à partir d'octets aléatoires (crypto). */
export function formatGiftCode(bytes: Uint8Array) {
  if (bytes.length < 8) throw new Error("8 octets aléatoires requis");
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Code tapé par le salon (minuscules, espaces, sans tiret) remis au format XXXX-XXXX. */
export function normalizeGiftCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length !== 8) return null;
  if ([...raw].some((c) => !CODE_ALPHABET.includes(c))) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function giftCardExpiry(paidAt: Date) {
  const d = new Date(paidAt);
  d.setMonth(d.getMonth() + GIFT_CARD_VALIDITY_MONTHS);
  return d;
}

export type GiftCardState = "pending" | "active" | "used" | "expired";

/** État affiché d'une carte : payée ou non, solde restant, date de validité. */
export function giftCardState(
  card: { status: "pending" | "active"; balanceCents: number; expiresAt: Date | null },
  now = new Date(),
): GiftCardState {
  if (card.status === "pending") return "pending";
  if (card.balanceCents <= 0) return "used";
  if (card.expiresAt && card.expiresAt.getTime() < now.getTime()) return "expired";
  return "active";
}

/**
 * Utilisation d'une carte au salon (paiement total ou partiel d'une prestation).
 * Retourne le nouveau solde, ou une erreur expliquant le refus.
 */
export function redeemGiftCard(
  card: { status: "pending" | "active"; balanceCents: number; expiresAt: Date | null },
  amountCents: number,
  now = new Date(),
): { ok: true; balanceCents: number } | { ok: false; error: string } {
  const state = giftCardState(card, now);
  if (state === "pending") return { ok: false, error: "Cette carte n'a pas encore été payée." };
  if (state === "used") return { ok: false, error: "Cette carte a déjà été entièrement utilisée." };
  if (state === "expired") return { ok: false, error: "Cette carte a expiré." };
  if (!Number.isInteger(amountCents) || amountCents <= 0)
    return { ok: false, error: "Indiquez un montant supérieur à 0 €." };
  if (amountCents > card.balanceCents)
    return {
      ok: false,
      error: `Le montant dépasse le solde de la carte (${euros(card.balanceCents)}).`,
    };
  return { ok: true, balanceCents: card.balanceCents - amountCents };
}

/** « 12,50 » ou « 12 » → centimes ; null si la saisie n'est pas un montant. */
export function parseEuroInput(input: string): number | null {
  const v = input.replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  return Math.round(Number(v) * 100);
}

export function euros(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
