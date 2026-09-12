import type { Tables } from "@/types/database";
import { buildGenerationPrompt } from "@/lib/ai/prompt";
import { generationOutputSchema, type GenerationOutput } from "@/lib/ai/schema";
import { generateMockPlan } from "@/lib/ai/providers/mock";
import { resolveProvider, extractJson } from "@/lib/ai/providers/resolve";

type Product = Tables<"products">;

export class GenerationError extends Error {}

/**
 * Generates a full marketing plan for a product. Uses a real LLM provider
 * when `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` is configured (per
 * `AI_PROVIDER`), otherwise falls back to a deterministic offline generator
 * so the app remains fully usable in local/dev environments.
 */
export async function generateMarketingPlan(product: Product): Promise<GenerationOutput> {
  const provider = resolveProvider();

  if (!provider) {
    return generateMockPlan(product);
  }

  const { system, user } = buildGenerationPrompt(product);

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await provider.generate(system, user);
      const json = extractJson(raw);
      const parsed = generationOutputSchema.safeParse(json);
      if (parsed.success) {
        return parsed.data;
      }
      lastError = parsed.error;
    } catch (error) {
      lastError = error;
    }
  }

  console.error("AI generation failed after retries.", lastError);
  throw new GenerationError(
    "La génération du plan a échoué. Réessaie dans quelques instants."
  );
}
