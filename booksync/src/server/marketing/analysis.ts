import "server-only";
import {
  PRODUCT_ANALYSIS_INSTRUCTIONS,
  productAnalysisSchema,
  productPayload,
  type ProductAnalysis,
} from "@/domain/marketing/analysis";
import { assertCan } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";
import { UserError } from "@/server/errors";
import { generateStructured, latestGeneration, type AiClient } from "@/server/ai/gateway";
import { getProduct } from "./products";

export const ANALYSIS_KIND = "product_analysis";

export async function analyzeProduct(
  ctx: OrgContext,
  productId: string,
  deps?: { client?: AiClient | null; now?: Date },
) {
  assertCan(ctx.role, "marketing.manage");
  const p = await getProduct(ctx, productId);
  if (!p) throw new UserError("Produit introuvable.");
  return generateStructured({
    ctx,
    kind: ANALYSIS_KIND,
    productId: p.id,
    schema: productAnalysisSchema,
    instructions: PRODUCT_ANALYSIS_INSTRUCTIONS,
    payload: productPayload(p),
    tier: "fast",
    maxTokens: 6000,
    deps,
  });
}

/** Dernière analyse valide du produit (null si aucune ou si le format a changé). */
export async function latestAnalysis(
  ctx: OrgContext,
  productId: string,
): Promise<{ analysis: ProductAnalysis; createdAt: Date } | null> {
  const row = await latestGeneration(ctx, ANALYSIS_KIND, productId);
  if (!row) return null;
  const parsed = productAnalysisSchema.safeParse(row.output);
  return parsed.success ? { analysis: parsed.data, createdAt: row.createdAt } : null;
}
