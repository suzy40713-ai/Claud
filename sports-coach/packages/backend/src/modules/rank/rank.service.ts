import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../lib/env.js";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!env.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY non configuree : l'analyse video du defi n'est pas disponible.");
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return client;
}

export const RANK_LABELS = ["Bronze", "Argent", "Or", "Platine", "Diamant"] as const;
export const MAX_RANK = RANK_LABELS.length - 1;
export const REPS_REQUISES = 10;
export const FRAMES_PAR_DEFI = 6;

/**
 * Lundi 00:00 (UTC) de la semaine contenant `date`.
 */
export function mondayOf(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Le modele repond parfois avec du texte autour du JSON malgre la consigne
 * stricte. On extrait le premier objet JSON valide plutot que de faire
 * confiance a la sortie brute.
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

export interface PushupAnalysis {
  repsDetectees: number;
  formeValide: boolean;
  commentaire: string;
}

const PUSHUP_SYSTEM_PROMPT = `Tu es un coach sportif expert en analyse de mouvement. On te montre une sequence de ${FRAMES_PAR_DEFI} images extraites d'une video (dans l'ordre chronologique) d'une personne en train de faire des pompes, dans le cadre d'un defi hebdomadaire a ${REPS_REQUISES} repetitions.

A partir de cette sequence, estime :
- le nombre de repetitions completes que tu peux raisonnablement compter ou deduire (amplitude bras tendus -> poitrine proche du sol -> bras tendus)
- si la forme generale est correcte (dos droit/gaine, amplitude suffisante, pas de a-coups ou de triche flagrante)

Sois indulgent sur les details (angle de camera, qualite d'image) mais strict sur une triche evidente (genoux au sol presentes comme des pompes completes, amplitude quasi nulle, aucune pompe visible).

Si les images ne montrent clairement pas quelqu'un en train de faire des pompes, mets repsDetectees a 0, formeValide a false, et un commentaire l'expliquant.

Reponds UNIQUEMENT avec un objet JSON valide, sans aucun texte autour, de la forme :
{"repsDetectees": 10, "formeValide": true, "commentaire": "Belle serie, amplitude complete et dos gaine. Continue comme ca !"}

"commentaire" : une phrase courte, concrete et bienveillante (jamais culpabilisante), qui explique le verdict et encourage pour la prochaine fois.`;

export async function analyzePushupFrames(framesBase64: string[]): Promise<PushupAnalysis> {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: env.coachModel,
    max_tokens: 500,
    thinking: { type: "disabled" },
    system: PUSHUP_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          ...framesBase64.map(
            (data): Anthropic.ImageBlockParam => ({
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data },
            })
          ),
          { type: "text", text: `Defi de la semaine : ${REPS_REQUISES} pompes. Analyse cette sequence.` },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) {
    throw new Error("L'IA n'a pas renvoye de reponse exploitable.");
  }

  const parsed = extractJson(textBlock.text) as Partial<PushupAnalysis>;
  if (typeof parsed.repsDetectees !== "number" || typeof parsed.commentaire !== "string") {
    throw new Error("Format d'analyse video inattendu.");
  }

  return {
    repsDetectees: Math.max(0, Math.round(parsed.repsDetectees)),
    formeValide: Boolean(parsed.formeValide),
    commentaire: parsed.commentaire,
  };
}
