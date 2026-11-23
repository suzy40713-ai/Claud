/**
 * Modèles IA du copilote et calcul du coût réel (logique pure, testée).
 * Changer de modèle = changer une variable d'environnement : le reste du code ne dépend que du
 * « niveau » demandé (rapide / puissant).
 */

export type AiTier = "fast" | "strong";

/** Tarifs en dollars par million de jetons (prompts ≤ 100 000 jetons). */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
};

export const DEFAULT_MODELS: Record<AiTier, string> = {
  fast: "claude-haiku-5-5",
  // Le niveau « puissant » reste sur Haiku tant que le propriétaire n'a pas autorisé un modèle plus cher.
  strong: "claude-haiku-5-5",
};

export type AiUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

/** Coût d'un appel en millionièmes de dollar, arrondi au supérieur. Modèle inconnu : refusé. */
export function aiCostMicroUsd(model: string, u: AiUsage) {
  const p = MODEL_PRICING[model];
  if (!p) throw new Error(`Tarif inconnu pour le modèle ${model}`);
  const read = u.cache_read_input_tokens ?? 0;
  const write = u.cache_creation_input_tokens ?? 0;
  const dollars =
    (u.input_tokens * p.input + read * p.input * 0.1 + write * p.input * 1.25 + u.output_tokens * p.output) /
    1_000_000;
  return Math.ceil(dollars * 1_000_000);
}

export function monthStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}
