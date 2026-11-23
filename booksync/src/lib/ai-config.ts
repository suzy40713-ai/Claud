import "server-only";
import { env } from "@/lib/env";

/** Les fonctions IA sont actives dès qu'une clé API Anthropic est configurée côté serveur. */
export function isAiConfigured() {
  return Boolean(env.ANTHROPIC_API_KEY);
}
