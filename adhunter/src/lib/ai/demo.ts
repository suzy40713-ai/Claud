import type { AdAnalysis, AdCreation, CreatorInput } from "@/lib/ai/schemas";
import type { Ad } from "@/types/database";

/**
 * Template-based outputs used ONLY when DEMO_MODE=true and no AI key is set.
 * They are stored with `is_demo = true` and the UI labels them
 * "Résultat de démonstration — non généré par l'IA".
 */
export function demoAnalysis(ad: Ad): AdAnalysis {
  const hook = ad.title || ad.body?.split(/[.!?]/)[0] || "Accroche non disponible";
  return {
    summary: `Exemple de démonstration : structure d'analyse appliquée à la publicité de ${ad.advertiser ?? "cet annonceur"}. Configure la clé IA pour obtenir une vraie analyse.`,
    hook: { text: hook, type: "Bénéfice direct (exemple)", analysis: "Dans une vraie analyse, l'IA explique ici pourquoi l'accroche capte (ou non) l'attention." },
    target_audience: {
      description: "Section d'exemple : public cible probable déduit du texte et du format.",
      segments: ["Segment d'exemple A", "Segment d'exemple B"],
      awareness_level: "Exemple : conscient du problème",
    },
    problem_solved: "Exemple : le problème principal auquel la publicité répond.",
    marketing_techniques: [
      { name: "Bénéfice concret", explanation: "Exemple d'explication d'une technique observée." },
      { name: "Réduction du risque", explanation: "Exemple : garantie, essai, retours gratuits." },
    ],
    strengths: ["Exemple de point fort", "Autre exemple de point fort"],
    weaknesses: ["Exemple de faiblesse"],
    ad_ideas: [
      { title: "Idée d'exemple 1", hook: "Accroche d'exemple", concept: "Concept d'exemple", format: "Vidéo 15 s" },
      { title: "Idée d'exemple 2", hook: "Accroche d'exemple", concept: "Concept d'exemple", format: "Carrousel" },
      { title: "Idée d'exemple 3", hook: "Accroche d'exemple", concept: "Concept d'exemple", format: "Image" },
    ],
    recommendations: ["Recommandation d'exemple 1", "Recommandation d'exemple 2"],
    confidence_note: "Résultat de démonstration généré par un modèle fixe, sans IA. Aucune conclusion ne doit en être tirée.",
  };
}

export function demoCreation(input: CreatorInput): AdCreation {
  const p = input.productName;
  return {
    hooks: [1, 2, 3, 4, 5].map((i) => `Accroche d'exemple ${i} pour ${p}`),
    ad_copies: [1, 2, 3].map((i) => ({ angle: `Angle d'exemple ${i}`, text: `Texte publicitaire d'exemple ${i} pour ${p}. Configure la clé IA pour générer de vrais textes.` })),
    ctas: ["CTA d'exemple 1", "CTA d'exemple 2", "CTA d'exemple 3"],
    video_concepts: [1, 2, 3].map((i) => ({ title: `Concept vidéo d'exemple ${i}`, duration: "15 s", scenes: ["Plan d'exemple 1", "Plan d'exemple 2", "Plan d'exemple 3"] })),
    visual_suggestions: ["Suggestion de visuel d'exemple 1", "Suggestion de visuel d'exemple 2", "Suggestion de visuel d'exemple 3"],
    platform_variants: {
      tiktok: `Variante TikTok d'exemple pour ${p}.`,
      instagram: `Variante Instagram d'exemple pour ${p}.`,
      facebook: `Variante Facebook d'exemple pour ${p}.`,
    },
  };
}
