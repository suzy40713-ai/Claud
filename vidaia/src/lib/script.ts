/**
 * Script d'une vidéo VidaIA : accroche, 3 points, conclusion, appel à l'action.
 * Logique pure (pas de réseau) : format, contrôle, texte de la voix off et minutage des scènes.
 */
import { z } from "zod";

export const TONES = ["dynamique", "pedagogique", "inspirant", "humour"] as const;
export const TONE_LABELS: Record<(typeof TONES)[number], string> = {
  dynamique: "Dynamique",
  pedagogique: "Pédagogique",
  inspirant: "Inspirant",
  humour: "Avec humour",
};

export const THEMES = ["bleu", "violet", "vert", "orange"] as const;
export type Theme = (typeof THEMES)[number];

export const requestSchema = z.object({
  description: z.string().trim().min(15, "Décrivez votre vidéo en quelques phrases.").max(800),
  tone: z.enum(TONES).default("dynamique"),
  cta: z.string().trim().max(40).optional().default(""),
  theme: z.enum(THEMES).default("bleu"),
});
export type VideoRequest = z.infer<typeof requestSchema>;

export const scriptSchema = z.object({
  hook: z.string().describe("Accroche à l'écran, 4 à 9 mots, qui arrête le scroll."),
  hookVoice: z.string().describe("Accroche dite à voix haute, une phrase courte."),
  points: z
    .array(
      z.object({
        title: z.string().describe("Titre du point, 2 à 5 mots."),
        detail: z.string().describe("Détail à l'écran, 4 à 10 mots."),
        voice: z.string().describe("Ce que dit la voix pour ce point, 1 ou 2 phrases courtes."),
      }),
    )
    .describe("Exactement 3 points."),
  closing: z.string().describe("Conclusion à l'écran, 3 à 8 mots."),
  closingVoice: z.string().describe("Conclusion dite à voix haute, une phrase, avec l'appel à l'action."),
  cta: z.string().describe("Appel à l'action à l'écran, 2 à 5 mots, ex. « Lien en bio 👆 »."),
});
export type VideoScript = z.infer<typeof scriptSchema>;

const FORBIDDEN = [/garanti/i, /argent facile/i, /devenir riche/i, /revenus? passifs?/i];

/** Contrôle : null si le script est utilisable, sinon la raison. */
export function checkScript(s: VideoScript): string | null {
  if (s.points.length !== 3) return "il faut exactement 3 points";
  if (s.hook.length > 70) return "accroche trop longue";
  if (s.points.some((p) => !p.title.trim() || p.title.length > 40 || p.detail.length > 90))
    return "point trop long ou vide";
  if (s.closing.length > 70 || s.cta.length > 40) return "conclusion trop longue";
  const voice = voiceSegments(s).join(" ");
  const words = voice.split(/\s+/).filter(Boolean).length;
  if (words < 25 || words > 110) return `voix off de longueur inadaptée (${words} mots)`;
  if (FORBIDDEN.some((re) => re.test(voice + s.hook + s.closing))) return "promesse interdite";
  return null;
}

/** Les 5 morceaux de la voix off, dans l'ordre des scènes. */
export function voiceSegments(s: VideoScript) {
  return [s.hookVoice, ...s.points.map((p) => p.voice), s.closingVoice].map((t) => t.trim());
}

export function voiceText(s: VideoScript) {
  return voiceSegments(s).join(" ");
}

export type Alignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

/**
 * Début de chaque scène (secondes) à partir de l'alignement caractère par caractère de la voix.
 * Les morceaux sont joints par une espace : le morceau i commence au caractère offset(i).
 */
export function sceneStarts(s: VideoScript, a: Alignment): { starts: number[]; voiceEnd: number } {
  const segs = voiceSegments(s);
  const starts: number[] = [];
  let offset = 0;
  const n = a.character_start_times_seconds.length;
  for (const seg of segs) {
    const i = Math.min(offset, n - 1);
    starts.push(i >= 0 ? a.character_start_times_seconds[i] : 0);
    offset += seg.length + 1;
  }
  starts[0] = 0;
  const voiceEnd = n > 0 ? a.character_end_times_seconds[n - 1] : 0;
  // Ordre croissant garanti (alignement imparfait).
  for (let i = 1; i < starts.length; i++) starts[i] = Math.max(starts[i], starts[i - 1] + 0.5);
  return { starts, voiceEnd };
}

/** Durée totale de la vidéo : voix + carte de fin. */
export function videoDuration(voiceEnd: number) {
  return Math.ceil((voiceEnd + 1.8) * 10) / 10;
}

export function scriptPrompt(r: VideoRequest) {
  return `Écris le script d'une vidéo verticale de 20 à 35 secondes (TikTok, Reels, Shorts) en français.
Sujet décrit par le client : """${r.description}"""
Ton : ${TONE_LABELS[r.tone]}.
${r.cta ? `Appel à l'action souhaité : « ${r.cta} ».` : "Appel à l'action : à choisir selon le sujet (ex. « Lien en bio 👆 », « Abonne-toi 🔔 »)."}
Structure : une accroche forte, exactement 3 points concrets, une conclusion avec l'appel à l'action.`;
}

export const SCRIPT_SYSTEM = `Tu es scénariste de vidéos courtes pour les réseaux sociaux. Tu écris en français, simple et percutant, en tutoyant le spectateur.
Règles :
- Phrases courtes, faciles à dire à voix haute. Pas d'abréviations ni de symboles dans les textes de voix (écris les nombres en lettres si besoin).
- Les textes à l'écran sont très courts ; un emoji au plus par texte à l'écran, aucun dans la voix.
- N'invente aucun chiffre, aucune statistique, aucun témoignage. Ne promets jamais de résultat ni de revenu.
- Reste fidèle au sujet du client ; n'ajoute pas de marque qu'il n'a pas citée.`;
