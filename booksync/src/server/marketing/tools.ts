import "server-only";
import { productPayload } from "@/domain/marketing/analysis";
import { TOOLS, type ToolKind } from "@/domain/marketing/tools";
import { parseToolOptions } from "@/domain/marketing/tools/options";
import { assertCan } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";
import { UserError } from "@/server/errors";
import type { z } from "zod";
import { TOOL_PROMPTS } from "@/domain/marketing/prompts";
import type { AiDeps } from "@/server/ai/engine";
import { generationCount, getGeneration, listGenerations } from "@/server/ai/gateway";
import { produce } from "@/server/ai/produce";
import { fetchPublicPage, type FetchDeps } from "@/server/web/fetch-page";
import type { PageSummary } from "@/domain/marketing/page-extract";
import { parseCompetitorUrls } from "@/domain/marketing/tools/competitors";
import { runTemplate } from "@/domain/marketing/templates";
import { getProduct } from "./products";

/** Lance un outil du copilote : IA gratuite si disponible, sinon modèle BookSync. */
export async function runTool(
  ctx: OrgContext,
  kind: ToolKind,
  productId: string,
  rawOptions: unknown,
  deps?: AiDeps & { web?: FetchDeps },
) {
  assertCan(ctx.role, "marketing.manage");
  const tool = TOOLS[kind];
  const p = await getProduct(ctx, productId);
  if (!p) throw new UserError("Choisissez un de vos produits.", { productId: "Produit introuvable." });
  const { values, labelled } = parseToolOptions(tool.options, rawOptions);
  const seed = await generationCount(ctx, kind, p.id);
  const payload: Record<string, unknown> = { produit: productPayload(p), choix: labelled };
  let pages: Array<{ url: string; page: PageSummary | null }> = [];
  if (kind === "competitors") {
    // Pages publiques des concurrents, lues de façon sûre côté serveur.
    pages = await Promise.all(
      parseCompetitorUrls(String(values.urls ?? "")).map(async (url) => ({
        url,
        page: await fetchPublicPage(url, deps?.web),
      })),
    );
    payload.concurrents = pages.map(({ url, page }) =>
      page
        ? {
            adresse: page.url,
            titre: page.title,
            description: page.description,
            titres_de_la_page: page.headings,
            prix_trouves: page.prices,
            texte: page.text.slice(0, 2500),
          }
        : { adresse: url, illisible: true },
    );
  }
  const r = await produce(
    ctx,
    {
      kind,
      productId: p.id,
      schema: tool.schema as z.ZodType,
      instructions: TOOL_PROMPTS[kind],
      payload,
      template: () => runTemplate(kind, p, values, seed, { pages }),
      check: (tool as { check?: (o: unknown) => string | null }).check,
      maxTokens: kind === "strategy" ? 12000 : 5000,
    },
    deps,
  );
  return { ...r, options: values };
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
    model: row.model,
    input: row.input as { choix?: Record<string, string | string[]> },
    output: parsed.data as import("zod").infer<(typeof TOOLS)[K]["schema"]>,
  };
}

export async function toolHistory(ctx: OrgContext, kind: ToolKind) {
  assertCan(ctx.role, "marketing.manage");
  return listGenerations(ctx, { kind, limit: 30 });
}
