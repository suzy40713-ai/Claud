import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

import { UserFacingError } from "@/lib/errors";

let client: Anthropic | null = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new UserFacingError(
      "L'assistant IA est en préparation : la clé API n'est pas encore configurée.",
      "not_configured"
    );
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 120_000, maxRetries: 2 });
  return client;
}

export function aiModel() {
  return process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
}

type Effort = "low" | "medium" | "high";

function aiEffort(): Effort {
  const v = process.env.ANTHROPIC_EFFORT;
  return v === "low" || v === "high" ? v : "medium";
}

/**
 * Calls Claude with a Zod-typed structured output. The API key never leaves
 * the server. Server-side fallbacks keep a request alive if the primary
 * model declines it.
 */
export async function generateStructured<T extends z.ZodType>(opts: {
  system: string;
  prompt: string;
  schema: T;
  maxTokens?: number;
}): Promise<{ data: z.infer<T>; model: string }> {
  const anthropic = getClient();
  try {
    const response = await anthropic.beta.messages.parse({
      model: aiModel(),
      max_tokens: opts.maxTokens ?? 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: aiEffort(), format: betaZodOutputFormat(opts.schema) },
      system: opts.system,
      messages: [{ role: "user", content: opts.prompt }],
    });

    if (response.stop_reason === "refusal") {
      throw new UserFacingError("L'IA n'a pas pu traiter cette demande. Reformule ou choisis un autre contenu.", "upstream");
    }
    if (response.stop_reason === "max_tokens" || !response.parsed_output) {
      throw new Error(`Incomplete AI output (stop_reason=${response.stop_reason})`);
    }
    return { data: response.parsed_output as z.infer<T>, model: response.model };
  } catch (error) {
    if (error instanceof UserFacingError) throw error;
    if (error instanceof Anthropic.RateLimitError) {
      throw new UserFacingError("L'IA est très sollicitée en ce moment. Réessaie dans une minute.", "upstream");
    }
    if (error instanceof Anthropic.AuthenticationError) {
      throw new UserFacingError("L'assistant IA est mal configuré. Un administrateur a été prévenu.", "not_configured");
    }
    throw error;
  }
}
