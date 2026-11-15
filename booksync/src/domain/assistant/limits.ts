/**
 * Limites et coût de l'assistant BookSync — logique pure.
 * Objectif : une dépense prévisible et plafonnée, quel que soit l'usage.
 */

export const ASSISTANT_MODEL = "claude-haiku-5-5";

/** Tarifs Claude Haiku 5.5 en dollars par million de jetons (requêtes de 100 000 jetons ou moins). */
export const HAIKU_PRICING = {
  input: 0.1,
  output: 0.5,
  /** Au-delà de 100 000 jetons d'entrée, l'API applique un tarif supérieur (jamais atteint ici). */
  longInput: 0.5,
  longOutput: 2.5,
} as const;

export const ASSISTANT_LIMITS = {
  /** Questions par mois et par entreprise (forfait Pro). */
  questionsPerMonth: 300,
  /** Questions par jour et par utilisateur. */
  questionsPerUserPerDay: 40,
  /** Longueur maximale d'une question. */
  maxQuestionChars: 500,
  /** Appels au modèle par question (outils compris). */
  maxModelCalls: 5,
  /** Jetons de sortie par appel (réflexion comprise). */
  maxOutputTokens: 1500,
  /** Messages précédents renvoyés comme contexte. */
  historyMessages: 8,
  /** Validité d'une action proposée avant confirmation. */
  confirmationMinutes: 15,
} as const;

export type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

/** Coût réel d'un appel, en millionièmes de dollar (arrondi au supérieur). */
export function costMicroUsd(u: TokenUsage) {
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheWrite = u.cache_creation_input_tokens ?? 0;
  const prompt = u.input_tokens + cacheRead + cacheWrite;
  const long = prompt > 100_000;
  const inRate = long ? HAIKU_PRICING.longInput : HAIKU_PRICING.input;
  const outRate = long ? HAIKU_PRICING.longOutput : HAIKU_PRICING.output;
  const dollars =
    (u.input_tokens * inRate +
      cacheRead * inRate * 0.1 +
      cacheWrite * inRate * 1.25 +
      u.output_tokens * outRate) /
    1_000_000;
  return Math.ceil(dollars * 1_000_000);
}

export function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

export type QuotaState = {
  orgQuestionsThisMonth: number;
  userQuestionsToday: number;
  globalCostMicroUsdThisMonth: number;
  monthlyBudgetUsd: number;
};

/** Raison d'un refus, ou null si la question peut être posée. */
export function quotaRefusal(q: QuotaState): string | null {
  if (q.globalCostMicroUsdThisMonth >= q.monthlyBudgetUsd * 1_000_000)
    return "L'assistant a atteint son plafond de dépense mensuel. Il sera de nouveau disponible le mois prochain.";
  if (q.orgQuestionsThisMonth >= ASSISTANT_LIMITS.questionsPerMonth)
    return `Votre entreprise a utilisé ses ${ASSISTANT_LIMITS.questionsPerMonth} questions de ce mois-ci.`;
  if (q.userQuestionsToday >= ASSISTANT_LIMITS.questionsPerUserPerDay)
    return `Vous avez posé ${ASSISTANT_LIMITS.questionsPerUserPerDay} questions aujourd'hui. Réessayez demain.`;
  return null;
}
