import "server-only";
import { productAnalysisSchema, productPayload, type ProductAnalysis } from "@/domain/marketing/analysis";
import { analysisTemplate } from "@/domain/marketing/templates";
import { assertCan } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";
import { UserError } from "@/server/errors";
import { latestGeneration } from "@/server/ai/gateway";
import type { AiDeps } from "@/server/ai/engine";
import { produce } from "@/server/ai/produce";
import { TOOL_PROMPTS } from "@/domain/marketing/prompts";
import { getProduct } from "./products";

export const ANALYSIS_KIND = "product_analysis";

/** Analyse du produit : IA gratuite si disponible, sinon modèle BookSync (jamais de coût). */
export async function analyzeProduct(ctx: OrgContext, productId: string, deps?: AiDeps) {
  assertCan(ctx.role, "marketing.manage");
  const p = await getProduct(ctx, productId);
  if (!p) throw new UserError("Produit introuvable.");
  return produce(
    ctx,
    {
      kind: ANALYSIS_KIND,
      productId: p.id,
      schema: productAnalysisSchema,
      instructions: TOOL_PROMPTS.product_analysis,
      payload: { produit: productPayload(p) },
      template: () => analysisTemplate(p),
      maxTokens: 4000,
    },
    deps,
  );
}

/** Dernière analyse valide du produit (null si aucune ou si le format a changé). */
export async function latestAnalysis(
  ctx: OrgContext,
  productId: string,
): Promise<{ analysis: ProductAnalysis; createdAt: Date; model: string } | null> {
  const row = await latestGeneration(ctx, ANALYSIS_KIND, productId);
  if (!row) return null;
  const parsed = productAnalysisSchema.safeParse(row.output);
  return parsed.success
    ? { analysis: parsed.data, createdAt: row.createdAt, model: row.model }
    : null;
}
