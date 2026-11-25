/** Objectif « rentabiliser mon abonnement » (logique pure, testée). */

export function profitability(priceCents: number, revenueCents: number) {
  if (priceCents <= 0) return null;
  const percent = Math.min(100, Math.round((revenueCents / priceCents) * 100));
  return {
    percent,
    reached: revenueCents >= priceCents,
    remainingCents: Math.max(0, priceCents - revenueCents),
    profitCents: Math.max(0, revenueCents - priceCents),
  };
}

export type JourneyStep = { id: string; label: string; done: boolean; href: string };

/** Parcours du débutant : la prochaine étape est la première non faite. */
export function journey(s: {
  hasProduct: boolean;
  hasAnalysis: boolean;
  hasStrategy: boolean;
  hasPlan: boolean;
  hasSale: boolean;
}): JourneyStep[] {
  return [
    {
      id: "produit",
      label: "Choisir ce que vous vendez",
      done: s.hasProduct,
      href: "/tableau-de-bord/trouver-une-idee",
    },
    {
      id: "analyse",
      label: "Analyser votre produit",
      done: s.hasAnalysis,
      href: "/tableau-de-bord/produits",
    },
    {
      id: "strategie",
      label: "Créer votre stratégie 30 jours",
      done: s.hasStrategy,
      href: "/tableau-de-bord/strategies",
    },
    {
      id: "autopilot",
      label: "Lancer votre plan d'action",
      done: s.hasPlan,
      href: "/tableau-de-bord/strategies",
    },
    {
      id: "vente",
      label: "Noter votre première vente",
      done: s.hasSale,
      href: "/tableau-de-bord/resultats",
    },
  ];
}
