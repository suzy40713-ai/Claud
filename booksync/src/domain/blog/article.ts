/**
 * Article de blog écrit par l'agent SEO : format, contrôle qualité et règles de publication.
 * Logique pure (pas d'accès base ni réseau).
 */
import { z } from "zod";
import { BLOG_TOPICS, type BlogTopic } from "./topics";

/** Articles publiés au maximum par jour (UTC). */
export const POSTS_PER_DAY = 3;
/** Écart minimal entre deux articles, pour étaler les publications sur la journée. */
export const MIN_GAP_HOURS = 7;

export const blogArticleSchema = z.object({
  title: z.string().describe("Titre de l'article, 50 à 70 caractères, contient la recherche visée."),
  metaDescription: z
    .string()
    .describe("Résumé pour Google, 120 à 160 caractères, donne envie de lire sans exagérer."),
  intro: z.string().describe("Introduction de 2 à 4 phrases qui reprend la question du lecteur."),
  sections: z
    .array(
      z.object({
        heading: z.string().describe("Sous-titre de la partie."),
        paragraphs: z.array(z.string()).describe("1 à 3 paragraphes concrets."),
        bullets: z.array(z.string()).optional().describe("Liste facultative d'étapes ou d'exemples."),
      }),
    )
    .describe("4 à 6 parties."),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .describe("3 questions fréquentes avec une réponse de 2 à 3 phrases."),
  takeaway: z.string().describe("Conclusion : la première action à faire aujourd'hui, en 1 à 2 phrases."),
});

export type BlogArticle = z.infer<typeof blogArticleSchema>;

/** Promesses interdites : aucun article ne garantit des ventes ni un revenu. */
const FORBIDDEN = [
  /garanti/i,
  /devenir riche/i,
  /argent facile/i,
  /sans effort/i,
  /revenus? passifs?/i,
  /\d[\d\s.,]*\s?(?:€|euros?)\s*(?:par|\/)\s*(?:mois|jour|semaine|an)/i,
  /\b100\s?%\s*(?:sûr|certain|efficace)/i,
];

export function articleText(a: BlogArticle) {
  return [
    a.title,
    a.metaDescription,
    a.intro,
    ...a.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])]),
    ...a.faq.flatMap((f) => [f.question, f.answer]),
    a.takeaway,
  ].join("\n");
}

export function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Contrôle qualité : null si l'article peut être publié, sinon la raison du refus. */
export function checkArticle(a: BlogArticle): string | null {
  if (a.title.trim().length < 20 || a.title.length > 90) return "titre de longueur inadaptée";
  if (a.metaDescription.trim().length < 70 || a.metaDescription.length > 200)
    return "résumé de longueur inadaptée";
  if (a.sections.length < 4 || a.sections.length > 8) return "nombre de parties inadapté";
  if (a.sections.some((s) => !s.heading.trim() || s.paragraphs.filter((p) => p.trim()).length === 0))
    return "partie vide";
  if (a.faq.length < 2) return "questions fréquentes manquantes";
  const text = articleText(a);
  const words = wordCount(text);
  if (words < 650) return `article trop court (${words} mots)`;
  const bad = FORBIDDEN.find((re) => re.test(text));
  if (bad) return `promesse interdite (${bad.source})`;
  return null;
}

export function slugify(title: string) {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Prochain sujet à traiter : le premier mot-clé jamais publié, ou null si tous le sont. */
export function nextTopic(usedKeywords: Iterable<string>, topics: BlogTopic[] = BLOG_TOPICS) {
  const used = new Set([...usedKeywords].map((k) => k.toLowerCase()));
  return topics.find((t) => !used.has(t.keyword.toLowerCase())) ?? null;
}

/** Peut-on publier maintenant ? (quota du jour et écart minimal avec le dernier article). */
export function publishDecision(p: { publishedToday: number; lastPublishedAt: Date | null; now: Date }) {
  if (p.publishedToday >= POSTS_PER_DAY) return { ok: false as const, reason: "quota du jour atteint" };
  if (p.lastPublishedAt && p.now.getTime() - p.lastPublishedAt.getTime() < MIN_GAP_HOURS * 3_600_000)
    return { ok: false as const, reason: "trop tôt après le dernier article" };
  return { ok: true as const };
}

export function readingMinutes(a: BlogArticle) {
  return Math.max(1, Math.round(wordCount(articleText(a)) / 220));
}

export const BLOG_SYSTEM = `Tu es rédacteur web pour BookSync, un outil français qui aide les débutants à passer de leur idée à leurs premières ventes.
Tu écris en français, en vouvoyant le lecteur, des articles de blog utiles, concrets et honnêtes, optimisés pour Google sans bourrage de mots-clés.

Règles :
- Donne des conseils actionnables, des exemples précis et des étapes simples.
- N'invente aucune statistique, aucun chiffre de marché, aucune étude, aucun témoignage, aucune citation.
- Ne promets jamais de ventes, de revenus ou de résultats. Un exemple de calcul de prix ou de marge est permis s'il est présenté comme un exemple.
- Pour les sujets juridiques ou fiscaux, reste général et invite à vérifier sur les sites officiels (service-public.fr, URSSAF).
- Ne cite aucun outil payant comme obligatoire.
- Tu peux mentionner BookSync au plus une fois, sans exagérer : il aide à trouver une idée, analyser un produit, définir ses clients et suivre un plan d'action.
- Paragraphes courts (2 à 4 phrases), ton chaleureux et direct.
- Longueur totale : 900 à 1300 mots.`;

export function blogPrompt(topic: BlogTopic) {
  return `Écris un article de blog qui répond à la recherche Google : « ${topic.keyword} ».
Angle : ${topic.angle}.
Le titre doit contenir la recherche ou une formulation très proche.`;
}
