import type { Tables } from "@/types/database";
import type { PublicPageFetchResult } from "@/lib/fetch-public-page";
import { pageAnalysisOutputSchema, type PageAnalysisOutput } from "@/lib/ai/schema";
import { resolveProvider, extractJson } from "@/lib/ai/providers/resolve";

type Product = Tables<"products">;

export class PageAnalysisError extends Error {}

function buildPrompt(product: Product, page: PublicPageFetchResult) {
  const system = `Tu es un expert en optimisation de conversion (CRO) et en copywriting. Tu analyses une page produit publique et donnes des améliorations concrètes, jamais génériques. Réponds uniquement en JSON valide, sans texte autour.`;

  const user = `Produit analysé : ${product.name} — ${product.description}
Client cible : ${product.target_customer || "non précisé"}

Voici ce qui a pu être extrait publiquement de la page (${product.url}) :
- Titre : ${page.title || "non trouvé"}
- Meta description : ${page.metaDescription || "non trouvée"}
- Extrait du texte visible : ${page.textSnippet || "non disponible"}

Analyse cette page selon ces critères : titre, proposition de valeur, description, CTA, structure, confiance (preuve sociale, réassurance), objections, clarté, conversion.

Réponds avec ce JSON exact :
{
  "findings": {
    "value_proposition_clarity": string (évaluation concrète),
    "cta_clarity": string,
    "structure": string,
    "trust_signals": string,
    "objections_handling": string,
    "conversion_friction": string
  },
  "improvements": string[] (exactement 10 améliorations prioritaires, concrètes et actionnables, classées par impact décroissant)
}`;

  return { system, user };
}

function buildMockAnalysis(product: Product, page: PublicPageFetchResult): PageAnalysisOutput {
  const hasTitle = Boolean(page.title);
  const hasDescription = Boolean(page.metaDescription);

  return {
    findings: {
      value_proposition_clarity: hasTitle
        ? `Le titre "${page.title}" ne mentionne pas explicitement le bénéfice pour ${product.target_customer || "ton client"}.`
        : "Aucun titre détecté publiquement — c'est le premier point à corriger.",
      cta_clarity: "Le call-to-action principal n'est pas identifiable dans le contenu public analysé.",
      structure: "Impossible de confirmer une structure claire (problème → solution → preuve → CTA) depuis le HTML public.",
      trust_signals: "Aucune preuve sociale (avis, cas d'usage) détectée dans l'extrait analysé.",
      objections_handling: "Aucune FAQ ou section objections détectée publiquement.",
      conversion_friction: hasDescription
        ? "La meta description existe mais gagnerait à inclure un bénéfice chiffré ou concret."
        : "L'absence de meta description affaiblit le référencement et le partage sur les réseaux.",
    },
    improvements: [
      `Réécrire le titre de la page pour inclure le bénéfice principal pour ${product.target_customer || "ton client cible"}.`,
      "Ajouter une meta description orientée bénéfice de 150-160 caractères pour améliorer le CTR dans les résultats de recherche.",
      `Positionner un CTA unique et répété ("${product.name ? `Essayer ${product.name}` : "Commencer"}") au-dessus de la ligne de flottaison.`,
      "Ajouter une section 'Comment ça marche' en 3 étapes maximum pour clarifier l'usage.",
      "Intégrer au moins un élément de preuve sociale réel dès qu'il est disponible (avis, capture d'usage, chiffre vérifié).",
      "Créer une section FAQ traitant les 3 objections les plus fréquentes des clients.",
      "Réduire le nombre de champs ou d'étapes avant l'action principale (achat, essai, inscription).",
      "Ajouter une garantie ou politique de remboursement clairement visible si applicable.",
      "Vérifier que la page s'affiche correctement et rapidement sur mobile (majorité du trafic social).",
      "Ajouter des visuels ou une courte vidéo montrant le produit en action plutôt que du texte seul.",
    ],
  };
}

export async function analyzeProductPage(
  product: Product,
  page: PublicPageFetchResult
): Promise<PageAnalysisOutput> {
  const provider = resolveProvider();

  if (!provider) {
    return buildMockAnalysis(product, page);
  }

  const { system, user } = buildPrompt(product, page);

  try {
    const raw = await provider.generate(system, user);
    const json = extractJson(raw);
    const parsed = pageAnalysisOutputSchema.safeParse(json);
    if (parsed.success) {
      return parsed.data;
    }
    throw new PageAnalysisError("Réponse IA invalide.");
  } catch (error) {
    console.error("Page analysis failed", error);
    throw new PageAnalysisError("L'analyse de la page a échoué. Réessaie dans quelques instants.");
  }
}
