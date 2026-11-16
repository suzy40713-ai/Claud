/**
 * Acompte en ligne : calcul du montant (logique pure, testée unitairement).
 * L'acompte est encaissé sur le compte Stripe du professionnel (Stripe Connect) et déduit du prix
 * réglé sur place. BookSync ne prélève aucune commission.
 */
import { planIncludes } from "@/domain/autopilot/automations";
import type { PlanId } from "./plans";

export type DepositMode = "none" | "fixed" | "percent";

/** Minimum accepté par Stripe pour un paiement en euros. */
export const MIN_DEPOSIT_CENTS = 50;
/** Durée de validité de la page de paiement Stripe (minimum imposé par Stripe : 30 min). */
export const CHECKOUT_EXPIRY_MINUTES = 30;
/** Durée pendant laquelle le créneau reste bloqué en attendant le paiement (marge après l'expiration). */
export const DEPOSIT_HOLD_MINUTES = CHECKOUT_EXPIRY_MINUTES + 5;
/** Forfait minimal pour proposer l'acompte. */
export const DEPOSIT_MIN_PLAN: PlanId = "starter";

export const MAX_FIXED_DEPOSIT_CENTS = 100_000;

export function depositAllowed(plan: PlanId) {
  return planIncludes(plan, DEPOSIT_MIN_PLAN);
}

/**
 * Montant de l'acompte pour une prestation : 0 si l'acompte est désactivé, si la prestation est
 * gratuite ou si le montant calculé est inférieur au minimum Stripe. Jamais supérieur au prix.
 */
export function computeDeposit(mode: DepositMode, value: number, priceCents: number): number {
  if (mode === "none" || priceCents <= 0 || value <= 0) return 0;
  const raw = mode === "fixed" ? value : Math.round((priceCents * Math.min(value, 100)) / 100);
  const amount = Math.min(raw, priceCents);
  return amount >= MIN_DEPOSIT_CENTS ? amount : 0;
}

/** Description lisible du réglage, ex. « 10,00 € » ou « 30 % du prix ». */
export function describeDeposit(mode: DepositMode, value: number) {
  if (mode === "fixed")
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
      value / 100,
    );
  if (mode === "percent") return `${value} % du prix`;
  return "Aucun acompte";
}
