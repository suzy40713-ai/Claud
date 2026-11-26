/** Packs de vidéos VidaIA : paiement unique, voix incluse. */
export type Pack = { id: "decouverte" | "createur" | "pro"; name: string; videos: number; priceCents: number };

export const PACKS: Pack[] = [
  { id: "decouverte", name: "Découverte", videos: 5, priceCents: 999 },
  { id: "createur", name: "Créateur", videos: 15, priceCents: 2499 },
  { id: "pro", name: "Pro", videos: 40, priceCents: 4999 },
];

export function findPack(id: unknown) {
  return PACKS.find((p) => p.id === id) ?? null;
}

export function formatEuros(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

/** Prix par vidéo, arrondi au centime. */
export function perVideo(p: Pack) {
  return Math.round(p.priceCents / p.videos);
}
