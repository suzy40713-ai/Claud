import "server-only";
import type { z } from "zod";
import { COPILOT_RULES, dataMessage } from "@/domain/marketing/prompts";
import type { OrgContext } from "@/server/auth/session";
import { aiJson, providerModel, type AiDeps } from "./engine";
import { aiRunsToday, assertToolQuota, saveGeneration, TEMPLATE_MODEL } from "./gateway";

/**
 * Produit un résultat d'outil : IA gratuite si disponible et dans le quota du jour de
 * l'entreprise, sinon modèle BookSync intégré. Le résultat est toujours validé et enregistré.
 */
export async function produce<S extends z.ZodType>(
  ctx: OrgContext,
  p: {
    kind: string;
    productId: string | null;
    schema: S;
    instructions: string;
    payload: Record<string, unknown>;
    template: () => z.infer<S>;
    check?: (o: z.infer<S>) => string | null;
    maxTokens?: number;
  },
  deps?: AiDeps,
) {
  await assertToolQuota(ctx);
  let output: z.infer<S> | null = null;
  let model = TEMPLATE_MODEL;
  if ((await aiRunsToday(ctx)) < ctx.plan.limits.aiRunsPerDay) {
    const r = await aiJson(
      {
        system: `${COPILOT_RULES}\n\n${p.instructions}`,
        user: dataMessage(p.payload),
        schema: p.schema,
        check: p.check,
        maxTokens: p.maxTokens,
      },
      deps,
    );
    if (r) {
      output = r.output;
      model = providerModel(r.provider);
    }
  }
  if (output === null) {
    output = p.schema.parse(p.template()) as z.infer<S>;
    const problem = p.check?.(output);
    if (problem) throw new Error(`Modèle ${p.kind} incomplet : ${problem}`);
  }
  const id = await saveGeneration(ctx, {
    kind: p.kind,
    productId: p.productId,
    input: p.payload,
    output: output as object,
    model,
  });
  return { id, output, ai: model !== TEMPLATE_MODEL, model };
}

/** Origine lisible d'un résultat (affichée sous chaque résultat). */
export function originLabel(model: string) {
  if (model.startsWith("groq:")) return "Rédigé par IA (Groq, offre gratuite)";
  if (model.startsWith("cloudflare:")) return "Rédigé par IA (Cloudflare, offre gratuite)";
  return "Version modèle BookSync";
}
