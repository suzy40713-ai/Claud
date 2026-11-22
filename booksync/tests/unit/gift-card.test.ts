import { describe, expect, it } from "vitest";
import {
  formatGiftCode,
  giftCardExpiry,
  giftCardState,
  giftCardsAllowed,
  normalizeGiftCode,
  parseEuroInput,
  parseGiftAmounts,
  redeemGiftCard,
  validGiftAmount,
} from "@/domain/billing/gift-card";

describe("cartes cadeaux — montants", () => {
  it("accepte des euros entiers entre 10 € et 500 €", () => {
    expect(validGiftAmount(1_000)).toBe(true);
    expect(validGiftAmount(50_000)).toBe(true);
    expect(validGiftAmount(900)).toBe(false);
    expect(validGiftAmount(50_100)).toBe(false);
    expect(validGiftAmount(2_550)).toBe(false);
  });

  it("nettoie la liste saisie : doublons, ordre, symbole €", () => {
    expect(parseGiftAmounts("100, 30€ 50 ; 30")).toEqual({
      ok: true,
      amounts: [3_000, 5_000, 10_000],
    });
  });

  it("refuse une liste vide, un texte ou un montant hors bornes", () => {
    expect(parseGiftAmounts("  ").ok).toBe(false);
    expect(parseGiftAmounts("trente").ok).toBe(false);
    expect(parseGiftAmounts("5").ok).toBe(false);
    expect(parseGiftAmounts("10 20 30 40 50 60 70").ok).toBe(false);
  });

  it("lit une saisie en euros avec virgule", () => {
    expect(parseEuroInput("12,50")).toBe(1_250);
    expect(parseEuroInput("35 €")).toBe(3_500);
    expect(parseEuroInput("12,505")).toBeNull();
    expect(parseEuroInput("abc")).toBeNull();
  });

  it("réservé aux forfaits Starter et Pro", () => {
    expect(giftCardsAllowed("free")).toBe(false);
    expect(giftCardsAllowed("starter")).toBe(true);
    expect(giftCardsAllowed("pro")).toBe(true);
  });
});

describe("cartes cadeaux — code", () => {
  it("formate 8 caractères lisibles en XXXX-XXXX", () => {
    const code = formatGiftCode(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 255]));
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(code).not.toMatch(/[01OIL]/);
  });

  it("retrouve le code tapé en minuscules ou sans tiret", () => {
    expect(normalizeGiftCode("abcd efgh")).toBe("ABCD-EFGH");
    expect(normalizeGiftCode("ABCD-EFGH")).toBe("ABCD-EFGH");
    expect(normalizeGiftCode("ABC")).toBeNull();
    expect(normalizeGiftCode("ABCD-EFG0")).toBeNull();
  });
});

describe("cartes cadeaux — utilisation", () => {
  const now = new Date("2026-12-01T10:00:00Z");
  const active = {
    status: "active" as const,
    balanceCents: 5_000,
    expiresAt: new Date("2027-12-01"),
  };

  it("valable 12 mois après le paiement", () => {
    expect(giftCardExpiry(new Date("2026-12-24T10:00:00Z")).toISOString()).toBe(
      "2027-12-24T10:00:00.000Z",
    );
  });

  it("déduit un montant partiel du solde", () => {
    expect(redeemGiftCard(active, 3_500, now)).toEqual({ ok: true, balanceCents: 1_500 });
  });

  it("refuse plus que le solde, 0 €, une carte non payée, épuisée ou expirée", () => {
    expect(redeemGiftCard(active, 5_001, now).ok).toBe(false);
    expect(redeemGiftCard(active, 0, now).ok).toBe(false);
    expect(redeemGiftCard({ ...active, status: "pending" }, 100, now).ok).toBe(false);
    expect(redeemGiftCard({ ...active, balanceCents: 0 }, 100, now).ok).toBe(false);
    expect(redeemGiftCard({ ...active, expiresAt: new Date("2026-11-30") }, 100, now).ok).toBe(
      false,
    );
  });

  it("donne l'état affiché de la carte", () => {
    expect(giftCardState(active, now)).toBe("active");
    expect(giftCardState({ ...active, balanceCents: 0 }, now)).toBe("used");
    expect(giftCardState({ ...active, status: "pending" }, now)).toBe("pending");
    expect(giftCardState({ ...active, expiresAt: new Date("2026-11-01") }, now)).toBe("expired");
  });
});
