import "server-only";
import { productPayload } from "@/domain/marketing/analysis";
import { TOOLS, type ToolKind } from "@/domain/marketing/tools";
import { parseToolOptions } from "@/domain/marketing/tools/options";
import { assertCan } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";
import { UserError } from "@/server/errors";
import { generationCount, getGeneration, listGenerations, saveGeneration } from "@/server/ai/gateway";
import { runTemplate } from "@/domain/marketing/templates";
import { getProduct } from "./products";

/** Lance un outil du copilote (stratégie, publicité, contenus, Sales Booster) : modèles gratuits, sans IA. */
export async function runTool(ctx: OrgContext, kind: ToolKind, productId: string, rawOptions: unknown) {
  assertCan(ctx.role, "marketing.manage");
  const tool = TOOLS[kind];
  const p = await getProduct(ctx, productId);
  if (!p) throw new UserError("Choisissez un de vos produits.", { productId: "Produit introuvable." });
  const { values, labelled } = parseToolOptions(tool.options, rawOptions);
  const seed = await generationCount(ctx, kind, p.id);
  const output = tool.schema.parse(runTemplate(kind, p, values, seed)) as object;
  const problem = (tool as { check?: (o: unknown) => string | null }).check?.(output);
  if (problem) throw new Error(`Modèle ${kind} incomplet : ${problem}`);
  const id = await saveGeneration(ctx, {
    kind,
    productId: p.id,
    input: { produit: productPayload(p), choix: labelled },
    output,
  });
  return { id, output, options: values };
}

/** Résultat d'un outil, validé : null s'il n'existe pas, appartient à une autre entreprise ou est invalide. */
export async function getToolResult<K extends ToolKind>(ctx: OrgContext, kind: K, id: string) {
  assertCan(ctx.role, "marketing.manage");
  const row = await getGeneration(ctx, id);
  if (!row || row.kind !== kind) return null;
  const parsed = TOOLS[kind].schema.safeParse(row.output);
  if (!parsed.success) return null;
  return {
    id: row.id,
    productId: row.productId,
    createdAt: row.createdAt,
    input: row.input as { choix?: Record<string, string | string[]> },
    output: parsed.data as import("zod").infer<(typeof TOOLS)[K]["schema"]>,
  };
}

export async function toolHistory(ctx: OrgContext, kind: ToolKind) {
  assertCan(ctx.role, "marketing.manage");
  return listGenerations(ctx, { kind, limit: 30 });
}
