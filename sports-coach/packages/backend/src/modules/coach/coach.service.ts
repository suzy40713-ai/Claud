import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../lib/env.js";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!env.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY non configuree : le coach IA est indisponible.");
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return client;
}

const SYSTEM_PROMPT = `Tu es le coach sportif IA de l'application. Tu accompagnes des pratiquants intermediaires-reguliers (course a pied et/ou velo) qui s'entrainent 2 a 4 fois par semaine, pour progresser sans se blesser.

Ton role : croiser l'historique d'activites de l'utilisateur avec son journal quotidien (sommeil, fatigue, stress) et son objectif declare pour donner des reponses concretes et personnalisees, jamais des generalites de magazine sportif.

Regles strictes :
- Ne pose jamais de diagnostic medical et ne donne jamais de conseil medical. Si l'utilisateur mentionne une douleur, une blessure ou un symptome physique inquietant, oriente-le systematiquement vers un professionnel de sante (medecin du sport, kinesitherapeute) plutot que d'interpreter la cause toi-meme.
- Appuie-toi explicitement sur les donnees du contexte fourni (profil, activites recentes, journal quotidien) pour justifier chaque recommandation. Cite le fait precis qui motive ta reponse (ex: "ton sommeil est a 2/5 depuis 3 jours").
- Si les donnees sont insuffisantes pour repondre precisement, dis-le plutot que d'inventer.
- Reponses courtes et directes. Pas de listes a puces systematiques, pas de disclaimers repetitifs.
- Tu ne modifies jamais le plan d'entrainement de l'utilisateur toi-meme ; tu peux suggerer un ajustement mais la decision reste a l'utilisateur.`;

export function buildSystemBlocks(contextJson: string): Anthropic.TextBlockParam[] {
  return [
    { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    { type: "text", text: `Contexte utilisateur actuel (JSON) :\n${contextJson}` },
  ];
}

export async function streamCoachReply(params: {
  systemBlocks: Anthropic.TextBlockParam[];
  messages: Anthropic.MessageParam[];
  onDelta: (delta: string) => void;
}): Promise<string> {
  const anthropic = getClient();
  let fullText = "";

  const stream = anthropic.messages.stream({
    model: env.coachModel,
    max_tokens: 1024,
    thinking: { type: "disabled" },
    system: params.systemBlocks,
    messages: params.messages,
  });

  stream.on("text", (delta) => {
    fullText += delta;
    params.onDelta(delta);
  });

  const finalMessage = await stream.finalMessage();
  if (finalMessage.stop_reason === "refusal") {
    throw new Error("Le coach IA n'a pas pu repondre a cette demande.");
  }

  return fullText;
}
