import { describe, expect, it } from "vitest";
import {
  computeDeposit,
  depositAllowed,
  describeDeposit,
  DEPOSIT_HOLD_MINUTES,
  CHECKOUT_EXPIRY_MINUTES,
} from "@/domain/billing/deposit";

describe("acompte", () => {
  it("montant fixe, plafonné au prix", () => {
    expect(computeDeposit("fixed", 1000, 2500)).toBe(1000);
    expect(computeDeposit("fixed", 5000, 2500)).toBe(2500);
  });
  it("pourcentage arrondi au centime", () => {
    expect(computeDeposit("percent", 30, 2500)).toBe(750);
    expect(computeDeposit("percent", 33, 1999)).toBe(660);
    expect(computeDeposit("percent", 150, 2000)).toBe(2000);
  });
  it("aucun acompte : désactivé, prestation gratuite ou montant sous le minimum Stripe", () => {
    expect(computeDeposit("none", 1000, 2500)).toBe(0);
    expect(computeDeposit("fixed", 1000, 0)).toBe(0);
    expect(computeDeposit("percent", 10, 400)).toBe(0); // 0,40 € < 0,50 €
    expect(computeDeposit("fixed", 49, 2500)).toBe(0);
    expect(computeDeposit("fixed", 0, 2500)).toBe(0);
  });
  it("réservé aux forfaits Starter et Pro", () => {
    expect(depositAllowed("free")).toBe(false);
    expect(depositAllowed("starter")).toBe(true);
    expect(depositAllowed("pro")).toBe(true);
  });
  it("le créneau reste bloqué plus longtemps que la page de paiement", () => {
    expect(CHECKOUT_EXPIRY_MINUTES).toBeGreaterThanOrEqual(30);
    expect(DEPOSIT_HOLD_MINUTES).toBeGreaterThan(CHECKOUT_EXPIRY_MINUTES);
  });
  it("description", () => {
    expect(describeDeposit("fixed", 1000)).toMatch(/^10,00\s€$/);
    expect(describeDeposit("percent", 30)).toBe("30 % du prix");
  });
});
