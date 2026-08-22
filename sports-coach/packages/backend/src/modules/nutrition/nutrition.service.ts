import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../lib/env.js";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!env.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY non configuree : les fonctionnalites nutrition IA sont indisponibles.");
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return client;
}

/**
 * Le modele repond parfois avec du texte autour du JSON (phrase d'intro,
 * bloc de code markdown) malgre la consigne stricte. On extrait le premier
 * objet JSON valide plutot que de faire confiance a la sortie brute.
 */
function extractJson(text: string): unknown {
  const withoutFences = text.replace(/```json\s*|```\s*/g, "");
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Reponse IA non exploitable (pas de JSON trouve).");
  }
  return JSON.parse(withoutFences.slice(start, end + 1));
}

export interface GroceryItem {
  categorie: string;
  nom: string;
  quantite: string;
}

const GROCERY_SYSTEM_PROMPT = `Tu es un nutritionniste sportif. On te donne le profil d'un pratiquant (objectif, niveau, sports pratiques). Genere une liste de courses pour une semaine (7 jours), adaptee a ce profil, en suivant une approche nutrition equilibree (proteines suffisantes, glucides complexes, legumes varies, pas de regime extreme).

Reponds UNIQUEMENT avec un objet JSON valide, sans aucun texte autour, de la forme :
{"items": [{"categorie": "Proteines", "nom": "Blancs de poulet", "quantite": "1 kg"}, ...]}

Regroupe les articles par categorie (Proteines, Feculents, Legumes, Fruits, Produits laitiers, Epicerie, Autres). Vise 18 a 25 articles au total, avec des quantites realistes pour une semaine.`;

export async function generateGroceryList(profil: {
  objectif: string | null;
  niveau: string | null;
  sportsPratiques: string[];
}): Promise<GroceryItem[]> {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: env.coachModel,
    max_tokens: 1500,
    thinking: { type: "disabled" },
    system: GROCERY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Profil : ${JSON.stringify(profil)}`,
      },
    ],
  });

  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) {
    throw new Error("L'IA n'a pas renvoye de reponse exploitable.");
  }

  const parsed = extractJson(textBlock.text) as { items?: GroceryItem[] };
  if (!Array.isArray(parsed.items)) {
    throw new Error("Format de liste de courses inattendu.");
  }
  return parsed.items;
}

export interface MealAnalysis {
  description: string;
  calories: number;
  proteinesG: number;
  glucidesG: number;
  lipidesG: number;
  confiance: "faible" | "moyenne" | "haute";
  adequationObjectif: "adapte" | "a_moderer" | "a_eviter";
  commentaireObjectif: string;
}

const MEAL_SCAN_SYSTEM_PROMPT = `Tu es un nutritionniste expert en estimation visuelle de repas. On te montre une photo d'un plat, ainsi que le profil nutritionnel de la personne (objectif, niveau, sports pratiques). Estime le contenu nutritionnel du repas du mieux possible a partir de ce que tu vois (types d'aliments, portions apparentes), puis juge si ce repas est adapte a l'objectif de la personne.

Reponds UNIQUEMENT avec un objet JSON valide, sans aucun texte autour, de la forme :
{"description": "Poulet grille, riz, brocolis", "calories": 550, "proteinesG": 40, "glucidesG": 55, "lipidesG": 15, "confiance": "moyenne", "adequationObjectif": "adapte", "commentaireObjectif": "Bon equilibre proteines/glucides pour une seance de musculation."}

"confiance" doit valoir "faible", "moyenne" ou "haute" selon la clarte de l'image et la facilite d'estimation.

"adequationObjectif" doit valoir :
- "adapte" si le repas correspond bien a l'objectif (ex: riche en proteines et equilibre pour perte de poids ou performance)
- "a_moderer" si le repas peut convenir occasionnellement mais n'est pas ideal pour l'objectif (ex: trop calorique, trop gras, glucides rapides en exces)
- "a_eviter" si le repas va clairement a l'encontre de l'objectif

"commentaireObjectif" : une phrase courte, concrete et bienveillante expliquant pourquoi, avec si pertinent un conseil pour le prochain repas. Jamais culpabilisant.

Si l'image ne montre clairement pas un repas ou une boisson, mets calories a 0, description "Aucun aliment identifie sur cette photo", confiance "faible", adequationObjectif "a_moderer" et commentaireObjectif "Impossible d'analyser cette image, reessaie avec une photo plus claire du plat."`;

export async function analyzeMealImage(
  imageBase64: string,
  mediaType: string,
  profil: { objectif: string | null; niveau: string | null; sportsPratiques: string[] }
): Promise<MealAnalysis> {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: env.coachModel,
    max_tokens: 600,
    thinking: { type: "disabled" },
    system: MEAL_SCAN_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType as "image/jpeg", data: imageBase64 },
          },
          { type: "text", text: `Analyse ce repas pour ce profil : ${JSON.stringify(profil)}` },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) {
    throw new Error("L'IA n'a pas renvoye de reponse exploitable.");
  }

  const parsed = extractJson(textBlock.text) as Partial<MealAnalysis>;
  if (
    typeof parsed.description !== "string" ||
    typeof parsed.calories !== "number" ||
    typeof parsed.proteinesG !== "number" ||
    typeof parsed.glucidesG !== "number" ||
    typeof parsed.lipidesG !== "number" ||
    typeof parsed.commentaireObjectif !== "string"
  ) {
    throw new Error("Format d'analyse de repas inattendu.");
  }

  return {
    description: parsed.description,
    calories: Math.round(parsed.calories),
    proteinesG: Math.round(parsed.proteinesG),
    glucidesG: Math.round(parsed.glucidesG),
    lipidesG: Math.round(parsed.lipidesG),
    confiance: parsed.confiance === "haute" || parsed.confiance === "moyenne" ? parsed.confiance : "faible",
    adequationObjectif:
      parsed.adequationObjectif === "adapte" || parsed.adequationObjectif === "a_eviter"
        ? parsed.adequationObjectif
        : "a_moderer",
    commentaireObjectif: parsed.commentaireObjectif,
  };
}
