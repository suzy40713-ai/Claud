import "server-only";
import { productAnalysisSchema, productPayload, type ProductAnalysis } from "@/domain/marketing/analysis";
import { analysisTemplate } from "@/domain/marketing/templates";
import { assertCan } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";
import { UserError } from "@/server/errors";
import { latestGeneration, saveGeneration } from "@/server/ai/gateway";
import { getProduct } from "./products";

export const ANALYSIS_KIND = "product_analysis";

/** Analyse gratuite construite à partir de la fiche produit (aucune IA, aucun coût). */
export async function analyzeProduct(ctx: OrgContext, productId: string) {
  assertCan(ctx.role, "marketing.manage");
  const p = await getProduct(ctx, productId);
  if (!p) throw new UserError("Produit introuvable.");
  const output = productAnalysisSchema.parse(analysisTemplate(p));
  const id = await saveGeneration(ctx, {
    kind: ANALYSIS_KIND,
    productId: p.id,
    input: { produit: productPayload(p) },
    output,
  });
  return { id, output };
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
