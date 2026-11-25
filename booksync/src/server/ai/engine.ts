import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { aiProviderUsage } from "@/db/schema";
import { extractJson, utcDay } from "@/domain/ai/json";
import { env } from "@/lib/env";

/**
 * Moteur d'IA gratuit de BookSync. Fournisseurs compatibles avec l'API « chat completions »,
 * essayés dans l'ordre : Groq, puis Cloudflare Workers AI. Chaque fournisseur a un plafond
 * d'appels par jour inférieur à son quota gratuit. Si aucun ne répond correctement, l'appelant
 * utilise les modèles BookSync intégrés : l'utilisateur obtient toujours un résultat.
 * Aucune clé n'est envoyée au navigateur, aucun service payant n'est utilisé.
 */
export type AiProvider = {
  id: "groq" | "cloudflare";
  label: string;
  url: string;
  key: string;
  model: string;
  cap: number;
  jsonMode: boolean;
};

export function configuredProviders(): AiProvider[] {
  const list: AiProvider[] = [];
  if (env.GROQ_API_KEY)
    list.push({
      id: "groq",
      label: "Groq",
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: env.GROQ_API_KEY,
      model: env.GROQ_MODEL,
      cap: env.GROQ_DAILY_CAP,
      jsonMode: true,
    });
  if (env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_AI_TOKEN)
    list.push({
      id: "cloudflare",
      label: "Cloudflare",
      url: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
      key: env.CLOUDFLARE_AI_TOKEN,
      model: env.CLOUDFLARE_AI_MODEL,
      cap: env.CLOUDFLARE_DAILY_CAP,
      jsonMode: false,
    });
  return list;
}

/** Au moins un fournisseur d'IA gratuit est configuré. */
export function isAiAvailable() {
  return configuredProviders().length > 0;
}

export type AiDeps = { fetch?: typeof fetch; providers?: AiProvider[]; now?: Date };
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Réserve un appel du jour ; false si le plafond quotidien est atteint (atomique). */
async function reserve(p: AiProvider, day: string) {
  if (p.cap <= 0) return false;
  const rows = await db
    .insert(aiProviderUsage)
    .values({ provider: p.id, day, calls: 1 })
    .onConflictDoUpdate({
      target: [aiProviderUsage.provider, aiProviderUsage.day],
      set: { calls: sql`${aiProviderUsage.calls} + 1` },
      setWhere: lt(aiProviderUsage.calls, p.cap),
    })
    .returning({ calls: aiProviderUsage.calls });
  return rows.length > 0;
}

async function recordFailure(p: AiProvider, day: string) {
  await db
    .update(aiProviderUsage)
    .set({ failures: sql`${aiProviderUsage.failures} + 1` })
    .where(and(eq(aiProviderUsage.provider, p.id), eq(aiProviderUsage.day, day)));
}

async function complete(
  p: AiProvider,
  messages: ChatMessage[],
  opts: { json: boolean; maxTokens: number; temperature: number },
  fetchImpl: typeof fetch,
) {
  const body: Record<string, unknown> = {
    model: p.model,
    messages,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature,
  };
  if (opts.json && p.jsonMode) body.response_format = { type: "json_object" };
  if (p.model.includes("gpt-oss")) body.reasoning_effort = "low";
  const res = await fetchImpl(p.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`${p.id} HTTP ${res.status}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }>;
  };
  const choice = data.choices?.[0];
  if (choice?.finish_reason === "length") throw new Error(`${p.id} réponse tronquée`);
  const content = choice?.message?.content;
  if (!content) throw new Error(`${p.id} réponse vide`);
  return content;
}

async function attempt<T>(
  deps: AiDeps | undefined,
  run: (p: AiProvider, fetchImpl: typeof fetch) => Promise<T | null>,
): Promise<{ value: T; provider: AiProvider } | null> {
  const providers = deps?.providers ?? configuredProviders();
  const fetchImpl = deps?.fetch ?? fetch;
  const day = utcDay(deps?.now ?? new Date());
  for (const p of providers) {
    if (!(await reserve(p, day))) continue;
    try {
      const value = await run(p, fetchImpl);
      if (value !== null) return { value, provider: p };
      await recordFailure(p, day);
    } catch (error) {
      console.error("[ia] fournisseur en échec", p.id, error instanceof Error ? error.message : error);
      await recordFailure(p, day);
    }
  }
  return null;
}

/**
 * Génération structurée : la réponse doit respecter le schéma (et le contrôle facultatif).
 * Renvoie null si aucun fournisseur gratuit n'est disponible ou valide.
 */
export async function aiJson<S extends z.ZodType>(
  p: {
    system: string;
    user: string;
    schema: S;
    maxTokens?: number;
    check?: (o: z.infer<S>) => string | null;
  },
  deps?: AiDeps,
): Promise<{ output: z.infer<S>; provider: AiProvider } | null> {
  const jsonSchema = JSON.stringify(z.toJSONSchema(p.schema));
  const system = `${p.system}

Réponds UNIQUEMENT avec un objet JSON valide (sans texte autour, sans bloc de code) qui respecte ce schéma JSON :
${jsonSchema}`;
  const r = await attempt(deps, async (provider, fetchImpl) => {
    const text = await complete(
      provider,
      [
        { role: "system", content: system },
        { role: "user", content: p.user },
      ],
      { json: true, maxTokens: p.maxTokens ?? 4000, temperature: 0.6 },
      fetchImpl,
    );
    const parsed = p.schema.safeParse(extractJson(text));
    if (!parsed.success) {
      console.error("[ia] réponse hors schéma", provider.id, parsed.error.issues.slice(0, 3));
      return null;
    }
    const problem = p.check?.(parsed.data);
    if (problem) {
      console.error("[ia] réponse incomplète", provider.id, problem);
      return null;
    }
    return parsed.data as z.infer<S>;
  });
  return r ? { output: r.value, provider: r.provider } : null;
}

/** Réponse libre (assistant). Renvoie null si aucun fournisseur gratuit n'est disponible. */
export async function aiText(
  p: { messages: ChatMessage[]; maxTokens?: number },
  deps?: AiDeps,
): Promise<{ text: string; provider: AiProvider } | null> {
  const r = await attempt(deps, async (provider, fetchImpl) => {
    const text = await complete(
      provider,
      p.messages,
      { json: false, maxTokens: p.maxTokens ?? 1200, temperature: 0.5 },
      fetchImpl,
    );
    return text.trim() || null;
  });
  return r ? { text: r.value, provider: r.provider } : null;
}

/** Libellé du modèle enregistré avec chaque résultat. */
export function providerModel(p: AiProvider) {
  return `${p.id}:${p.model}`;
}
