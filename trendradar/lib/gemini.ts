import { GoogleGenAI } from "@google/genai";
import type { ContentStyle, Platform } from "@/lib/supabase/types";

const MODEL = "gemini-2.5-flash";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY manquante dans les variables d'environnement.");
  }
  return new GoogleGenAI({ apiKey });
}

async function callGemini(prompt: string): Promise<string> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.9,
    },
  });
  const text = response.text;
  if (!text) throw new Error("Réponse vide de Gemini.");
  return text;
}

function extractJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "");
  return JSON.parse(cleaned) as T;
}

const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram Reels",
  youtube_shorts: "YouTube Shorts",
};

const STYLE_LABEL: Record<ContentStyle, string> = {
  educational: "Éducatif",
  storytelling: "Storytelling",
  ranking: "Classement",
  debate: "Débat",
  humor: "Humour",
  news: "Actualité",
  tutorial: "Tutoriel",
};

export interface GeneratedIdea {
  title: string;
  hook: string;
  concept: string;
  format: string;
  recommended_duration: string;
  audience: string;
  cta: string;
  hashtags: string[];
  opportunity_score: number;
  score_breakdown: {
    curiosity: number;
    clarity: number;
    retention: number;
    shareability: number;
    originality: number;
    platform_fit: number;
  };
}

export async function generateIdeas(params: {
  niche: string;
  platform: Platform;
  style: ContentStyle;
  count: number;
}): Promise<GeneratedIdea[]> {
  const { niche, platform, style, count } = params;

  const prompt = `Tu es un stratège de contenu viral spécialisé en vidéos courtes (${PLATFORM_LABEL[platform]}).
Génère exactement ${count} idées de vidéos originales et concrètes pour la niche : "${niche}".
Style demandé : ${STYLE_LABEL[style]}.

Pour CHAQUE idée, calcule un "Opportunity Score" sur 100 basé sur 6 critères notés sur 100 chacun :
- curiosity (curiosité suscitée)
- clarity (clarté du concept)
- retention (potentiel de rétention jusqu'à la fin)
- shareability (potentiel de partage)
- originality (originalité par rapport aux contenus déjà vus)
- platform_fit (adaptation au format ${PLATFORM_LABEL[platform]})

L'opportunity_score global est la moyenne pondérée de ces critères (arrondie à l'entier).
Ce score est une estimation qualitative de l'IA, jamais une garantie de viralité.

Réponds STRICTEMENT en JSON valide, sous la forme d'un tableau d'objets avec ces clés exactes :
title, hook, concept, format, recommended_duration, audience, cta, hashtags (tableau de 3 à 6 strings sans espaces, avec #), opportunity_score (entier), score_breakdown (objet avec curiosity, clarity, retention, shareability, originality, platform_fit, tous entiers 0-100).

Écris en français, de façon percutante et spécifique à la niche "${niche}". Ne renvoie aucun texte hors du JSON.`;

  const text = await callGemini(prompt);
  const ideas = extractJson<GeneratedIdea[]>(text);
  return ideas.slice(0, count);
}

export interface GeneratedScript {
  hook: string;
  introduction: string;
  development: string;
  conclusion: string;
  cta: string;
  estimated_duration: string;
  narration_notes: string;
  on_screen_text: string;
  visual_ideas: string;
}

export async function generateScript(params: {
  idea: { title: string; hook: string; concept: string; cta?: string | null };
  platform: Platform;
  mode?: "default" | "captivating" | "shorter" | "suspense" | "alternative";
}): Promise<GeneratedScript> {
  const { idea, platform, mode = "default" } = params;

  const modeInstruction: Record<string, string> = {
    default: "Structure standard, claire et efficace.",
    captivating:
      "Rends le script beaucoup plus captivant : renforce le hook, ajoute des rebondissements, un ton plus intense.",
    shorter:
      "Raccourcis fortement le script pour tenir dans une durée minimale tout en gardant l'impact.",
    suspense:
      "Ajoute du suspense : retarde la résolution, utilise des cliffhangers et des questions ouvertes.",
    alternative:
      "Propose une version alternative complètement différente dans l'approche narrative, même sujet.",
  };

  const prompt = `Tu es un scénariste expert en vidéos courtes virales sur ${PLATFORM_LABEL[platform]}.
Idée : "${idea.title}"
Hook de départ : "${idea.hook}"
Concept : ${idea.concept}
${idea.cta ? `CTA suggéré : ${idea.cta}` : ""}

Consigne de version : ${modeInstruction[mode]}

Génère un script complet en français avec :
- hook (les 3 premières secondes, doit arrêter le scroll)
- introduction
- development (corps principal, découpé en étapes claires)
- conclusion
- cta (appel à l'action final)
- estimated_duration (ex: "35-45 secondes")
- narration_notes (ton, rythme, énergie à adopter à l'oral)
- on_screen_text (texte à afficher à l'écran, étape par étape)
- visual_ideas (idées de plans, transitions, effets visuels)

Réponds STRICTEMENT en JSON valide avec ces clés exactes uniquement. Pas de texte hors JSON.`;

  const text = await callGemini(prompt);
  return extractJson<GeneratedScript>(text);
}

export async function generateVariants(params: {
  idea: { title: string; hook: string; concept: string };
  platform: Platform;
  count?: number;
}): Promise<GeneratedIdea[]> {
  const { idea, platform, count = 5 } = params;

  const prompt = `Tu es un stratège de contenu ${PLATFORM_LABEL[platform]}.
À partir de cette idée de base :
Titre : "${idea.title}"
Hook : "${idea.hook}"
Concept : ${idea.concept}

Génère ${count} variantes de cette idée : même thème général, mais angle, hook ou format différents à chaque fois.
Pour chaque variante calcule un opportunity_score (0-100) et son score_breakdown (curiosity, clarity, retention, shareability, originality, platform_fit, tous 0-100).

Réponds STRICTEMENT en JSON valide sous forme de tableau d'objets avec les clés exactes :
title, hook, concept, format, recommended_duration, audience, cta, hashtags (tableau de strings), opportunity_score, score_breakdown.
Écris en français. Pas de texte hors JSON.`;

  const text = await callGemini(prompt);
  const ideas = extractJson<GeneratedIdea[]>(text);
  return ideas.slice(0, count);
}

export interface IdeaAnalysis {
  overall_score: number;
  curiosity_score: number;
  clarity_score: number;
  originality_score: number;
  retention_score: number;
  share_score: number;
  strengths: string[];
  improvements: string[];
  improved_versions: { title: string; hook: string; concept: string }[];
}

export async function analyzeIdea(rawIdea: string): Promise<IdeaAnalysis> {

  const prompt = `Tu es un expert en stratégie de contenu vidéo courte (TikTok, Reels, Shorts).
Un créateur te soumet son idée de vidéo, telle quelle, sans reformulation de sa part :
"${rawIdea}"

Analyse cette idée et note-la sur 100 pour chacun de ces critères :
- curiosity_score
- clarity_score
- originality_score
- retention_score
- share_score

Calcule overall_score comme moyenne de ces 5 critères (entier).

Donne ensuite :
- strengths : liste de 2 à 4 points forts concrets ("Ce qui fonctionne")
- improvements : liste de 2 à 4 points à améliorer concrets ("Ce qui peut être amélioré")
- improved_versions : exactement 3 versions améliorées de l'idée, chacune avec title, hook, concept

Réponds STRICTEMENT en JSON valide avec les clés exactes : overall_score, curiosity_score, clarity_score, originality_score, retention_score, share_score, strengths, improvements, improved_versions.
Écris en français. Pas de texte hors JSON.`;

  const text = await callGemini(prompt);
  return extractJson<IdeaAnalysis>(text);
}

export interface RadarSignalDraft {
  title: string;
  description: string;
  category: "trending" | "rising" | "watch" | "opportunity";
  confidence: number;
}

/**
 * AI-estimated radar signals. These are explicitly NOT real-time trend
 * data — see the `source: "ai_estimate"` flag persisted alongside them
 * and the disclaimer rendered on the Radar page. Swap this function for
 * a Google Trends / social API pull once one is connected; the shape of
 * `radar_signals` in the DB already supports `source: "google_trends"`
 * and `"social_api"`.
 */
export async function generateRadarSignals(params: {
  niche: string;
  platform: Platform | "all";
}): Promise<RadarSignalDraft[]> {
  const { niche, platform } = params;

  const prompt = `Tu es un analyste de tendances de contenu court format.
Pour la niche "${niche}" ${platform !== "all" ? `sur ${PLATFORM_LABEL[platform as Platform]}` : "(tous formats)"}, propose une estimation qualitative (pas des données temps réel) de 8 signaux répartis dans ces 4 catégories :
- trending (2 signaux) : angles déjà très exploités mais qui fonctionnent encore
- rising (2 signaux) : angles en progression, encore peu saturés
- watch (2 signaux) : signaux faibles à surveiller
- opportunity (2 signaux) : angles sous-exploités à fort potentiel

Pour chaque signal donne : title (court), description (1-2 phrases), category, confidence (0-100, ton niveau de confiance dans cette estimation qualitative).

Réponds STRICTEMENT en JSON valide sous forme de tableau d'objets avec les clés exactes : title, description, category, confidence.
Écris en français. Pas de texte hors JSON.`;

  const text = await callGemini(prompt);
  return extractJson<RadarSignalDraft[]>(text);
}
