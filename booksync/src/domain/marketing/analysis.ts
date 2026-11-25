/**
 * Analyse de produit : format du résultat (validé avant affichage). Chaque point indique s'il repose sur ce que l'utilisateur a fourni ou s'il
 * s'agit d'une hypothèse à vérifier : rien n'est présenté comme une donnée de marché.
 */
import { z } from "zod";

export const BASIS = ["fourni", "hypothese"] as const;
export type Basis = (typeof BASIS)[number];

export const BASIS_LABELS: Record<Basis, string> = {
  fourni: "D'après vos informations",
  hypothese: "Hypothèse à vérifier",
};

const point = z.object({
  text: z.string().describe("Une phrase claire et concrète."),
  basis: z.enum(BASIS).describe("fourni si cela découle des informations données, sinon hypothese."),
});

export const POTENTIAL_LEVELS = ["faible", "moyen", "eleve"] as const;
export const POTENTIAL_LABELS: Record<(typeof POTENTIAL_LEVELS)[number], string> = {
  faible: "Potentiel faible",
  moyen: "Potentiel moyen",
  eleve: "Potentiel élevé",
};

export const productAnalysisSchema = z.object({
  summary: z.string().describe("Résumé en 2 ou 3 phrases de ce que vend l'utilisateur et à qui."),
  pitch: z.string().describe("Présentation commerciale prête à utiliser, 3 à 4 phrases."),
  potential: z
    .object({
      level: z.enum(POTENTIAL_LEVELS),
      reasoning: z.string().describe("Pourquoi, en 2 phrases. Estimation qualitative, jamais un chiffre de ventes."),
    })
    .describe("Potentiel commercial estimé (hypothèse)."),
  sellingArguments: z.array(z.string()).describe("4 arguments qui pourraient convaincre un client."),
  improvements: z.array(z.string()).describe("3 à 5 recommandations d'amélioration du produit ou de l'offre."),
  strengths: z.array(point).describe("3 à 5 points forts du produit tel que décrit."),
  weaknesses: z.array(point).describe("2 à 4 points faibles ou flous à corriger."),
  audiences: z
    .array(
      z.object({
        name: z.string().describe("Nom court du profil d'acheteur."),
        description: z.string(),
        motivation: z.string().describe("Ce qui pousserait ce profil à acheter."),
        basis: z.enum(BASIS),
      }),
    )
    .describe("2 ou 3 profils d'acheteurs."),
  positioning: z.string().describe("Une phrase de positionnement proposée."),
  pricing: z
    .string()
    .describe(
      "Commentaire sur le prix indiqué (cohérence avec la promesse), sans citer de prix concurrents. Si aucun prix, explique comment le fixer.",
    ),
  angles: z
    .array(z.object({ title: z.string(), hook: z.string().describe("Accroche d'une phrase.") }))
    .describe("3 angles marketing différents avec une accroche chacun."),
  channels: z
    .array(z.object({ channel: z.string(), why: z.string() }))
    .describe("2 à 4 canaux gratuits ou peu coûteux adaptés."),
  objections: z
    .array(z.object({ objection: z.string(), answer: z.string() }))
    .describe("3 objections probables d'un acheteur et comment y répondre."),
  toVerify: z
    .array(z.string())
    .describe("Questions à vérifier auprès de vrais clients avant d'investir."),
  firstActions: z.array(z.string()).describe("Les 3 premières actions à faire cette semaine."),
});

export type ProductAnalysis = z.infer<typeof productAnalysisSchema>;


/** Données du produit conservées avec chaque résultat (jamais d'identifiant interne). */
export function productPayload(p: {
  name: string;
  description: string;
  priceCents: number | null;
  category: string;
  benefits: string | null;
  targetAudience: string | null;
  url: string | null;
}) {
  return {
    nom: p.name,
    description: p.description,
    prix: p.priceCents === null ? "non indiqué" : `${(p.priceCents / 100).toFixed(2)} €`,
    categorie: p.category,
    avantages: p.benefits ?? "non renseigné",
    public_cible: p.targetAudience ?? "non renseigné",
    page: p.url ?? "aucune",
  };
}
