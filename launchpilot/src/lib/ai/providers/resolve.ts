import { createAnthropicProvider } from "./anthropic";
import { createOpenAiProvider } from "./openai";
import type { LlmProvider } from "./types";

/**
 * Resolves the configured LLM provider from env vars, falling back to
 * whichever key is actually present. Returns null when no key is
 * configured at all, signalling callers to use an offline/mock fallback.
 */
export function resolveProvider(): LlmProvider | null {
  const configured = (process.env.AI_PROVIDER || "").toLowerCase();

  if (configured === "openai" && process.env.OPENAI_API_KEY) {
    return createOpenAiProvider();
  }
  if (configured === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return createAnthropicProvider();
  }
  if (process.env.ANTHROPIC_API_KEY) return createAnthropicProvider();
  if (process.env.OPENAI_API_KEY) return createOpenAiProvider();
  return null;
}

export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1] : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("Impossible d'extraire un JSON valide de la réponse du modèle.");
  }
}
