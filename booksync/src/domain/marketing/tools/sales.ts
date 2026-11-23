import { z } from "zod";
import type { ToolOption } from "./options";

export const SALES_OPTIONS: readonly ToolOption[] = [
  {
    type: "select",
    name: "problem",
    label: "Votre situation",
    default: "pas-de-ventes",
    choices: [
      { value: "pas-de-visites", label: "Peu de visites sur ma page" },
      { value: "pas-de-ventes", label: "Des visites mais peu de ventes" },
      { value: "paniers", label: "Des paniers abandonnés" },
      { value: "panier-moyen", label: "Augmenter le montant moyen d'achat" },
      { value: "inconnu", label: "Je ne sais pas" },
    ],
  },
  {
    type: "text",
    name: "pageText",
    label: "Texte de votre page de vente (facultatif)",
    hint: "Copiez-collez le texte de votre page. BookSync ne visite pas votre site : l'analyse porte uniquement sur ce texte.",
    placeholder: "Titre, description, prix, livraison, garanties…",
    maxLength: 8000,
    optional: true,
  },
];

export const salesSchema = z.object({
  diagnosis: z.string().describe("Ce qui freine probablement les ventes, présenté comme une hypothèse."),
  quickWins: z
    .array(
      z.object({
        action: z.string(),
        why: z.string(),
        effort: z.enum(["faible", "moyen", "important"]),
      }),
    )
    .describe("5 améliorations rapides, par ordre de priorité."),
  rewrites: z
    .array(z.object({ element: z.string(), proposal: z.string() }))
    .describe("Réécritures proposées (titre, description, bouton…)."),
  abTests: z
    .array(
      z.object({
        element: z.string(),
        versionA: z.string(),
        versionB: z.string(),
        measure: z.string().describe("Ce qu'il faut mesurer pour départager."),
      }),
    )
    .describe("3 tests A/B simples."),
  trust: z.array(z.string()).describe("Éléments de confiance à ajouter s'ils sont vrais."),
  upsell: z.array(z.string()).describe("Idées pour augmenter le panier (lot, option, offre de lancement réelle)."),
});

export type SalesOutput = z.infer<typeof salesSchema>;

export const SALES_INSTRUCTIONS = `Outil : Sales Booster.
Propose des améliorations concrètes pour transformer plus de visiteurs en acheteurs.
- Si un texte de page est fourni, appuie-toi dessus et cite les passages à changer. Sinon, base-toi sur la fiche produit et dis-le.
- Tu n'as pas visité le site : ne prétends rien savoir de son design, de sa vitesse ou de ses statistiques.
- Tout est une hypothèse à tester ; aucune hausse de ventes ou de taux de conversion n'est promise ni chiffrée.
- Les éléments de confiance (avis, garanties, labels) ne doivent être ajoutés que s'ils sont réels.
- Pas de fausse urgence, de faux stock limité ni de faux avis.`;
