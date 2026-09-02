// Taux et seuils officiels micro-entrepreneur 2026 (France).
// Sources : URSSAF (autoentrepreneur.urssaf.fr) — vérifiés en septembre 2026.
// Ces montants changent chaque année : toujours vérifier sur le site officiel
// avant une décision engageante (dépassement de seuil, choix fiscal, etc.).
export const RATES_UPDATED_AT = "2026-09-02";

export type ActivityType = "vente" | "service_bic" | "liberal_bnc" | "liberal_cipav";

export interface ActivityInfo {
  label: string;
  cotisationRate: number; // part des cotisations sociales sur le CA encaisse
  versementLiberatoireRate: number; // option impot sur le revenu, en plus des cotisations
  seuilMicro: number; // plafond annuel de CA pour rester en micro-entreprise
  seuilTvaBase: number; // franchise en base de TVA, seuil de base
  seuilTvaMajore: number; // franchise en base de TVA, seuil majore (tolerance)
}

export const ACTIVITIES: Record<ActivityType, ActivityInfo> = {
  vente: {
    label: "Vente de marchandises",
    cotisationRate: 0.123,
    versementLiberatoireRate: 0.01,
    seuilMicro: 203_100,
    seuilTvaBase: 85_000,
    seuilTvaMajore: 93_500,
  },
  service_bic: {
    label: "Prestations de services (BIC)",
    cotisationRate: 0.212,
    versementLiberatoireRate: 0.017,
    seuilMicro: 83_600,
    seuilTvaBase: 37_500,
    seuilTvaMajore: 41_250,
  },
  liberal_cipav: {
    label: "Profession liberale (CIPAV)",
    cotisationRate: 0.232,
    versementLiberatoireRate: 0.022,
    seuilMicro: 83_600,
    seuilTvaBase: 37_500,
    seuilTvaMajore: 41_250,
  },
  liberal_bnc: {
    label: "Profession liberale (regime general)",
    cotisationRate: 0.256,
    versementLiberatoireRate: 0.022,
    seuilMicro: 83_600,
    seuilTvaBase: 37_500,
    seuilTvaMajore: 41_250,
  },
};

export interface ChargeResult {
  chiffreAffaires: number;
  cotisationsSociales: number;
  versementLiberatoire: number;
  totalPreleve: number;
  net: number;
}

export function computeCharges(
  activity: ActivityType,
  chiffreAffaires: number,
  useVersementLiberatoire: boolean
): ChargeResult {
  const info = ACTIVITIES[activity];
  const cotisationsSociales = chiffreAffaires * info.cotisationRate;
  const versementLiberatoire = useVersementLiberatoire ? chiffreAffaires * info.versementLiberatoireRate : 0;
  const totalPreleve = cotisationsSociales + versementLiberatoire;
  return {
    chiffreAffaires,
    cotisationsSociales,
    versementLiberatoire,
    totalPreleve,
    net: chiffreAffaires - totalPreleve,
  };
}

export function formatEuros(value: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    value
  );
}
