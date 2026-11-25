import "server-only";
import { and, count, desc, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { aiGeneration } from "@/db/schema";
import { monthStart } from "@/domain/ai/models";
import { LIMIT_MESSAGES, PlanLimitError } from "@/domain/billing/plans";
import type { OrgContext } from "@/server/auth/session";

/**
 * Historique des résultats du copilote (analyses, stratégies, publicités, contenus…).
 * Les résultats viennent de l'IA gratuite (Groq, Cloudflare) ou des modèles BookSync intégrés :
 * aucun service payant, coût toujours nul.
 */
export const TEMPLATE_MODEL = "modele-gratuit";

function monthRange(now: Date) {
  const since = monthStart(now);
  const until = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth() + 1, 1));
  return and(gte(aiGeneration.createdAt, since), lt(aiGeneration.createdAt, until));
}

/** Résultats produits par l'IA aujourd'hui (UTC) pour l'entreprise : partage équitable du quota gratuit. */
export async function aiRunsToday(ctx: OrgContext, now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [row] = await db
    .select({ n: count() })
    .from(aiGeneration)
    .where(
      and(
        eq(aiGeneration.organizationId, ctx.organization.id),
        gte(aiGeneration.createdAt, start),
        ne(aiGeneration.model, TEMPLATE_MODEL),
      ),
    );
  return row?.n ?? 0;
}

/** Propositions utilisées ce mois-ci par l'entreprise, et limite de son forfait (null = illimité). */
export async function toolUsage(ctx: OrgContext, now = new Date()) {
  const [row] = await db
    .select({ n: count() })
    .from(aiGeneration)
    .where(and(eq(aiGeneration.organizationId, ctx.organization.id), monthRange(now)));
  return { used: row?.n ?? 0, limit: ctx.plan.limits.toolRunsPerMonth };
}

/** Refuse une nouvelle proposition si le quota mensuel du forfait est atteint. */
export async function assertToolQuota(ctx: OrgContext, now = new Date()) {
  const { used, limit } = await toolUsage(ctx, now);
  if (limit !== null && used >= limit)
    throw new PlanLimitError("tools", LIMIT_MESSAGES.tools(ctx.plan));
}

/** Enregistre un résultat du copilote et renvoie son identifiant. */
export async function saveGeneration(
  ctx: OrgContext,
  g: {
    kind: string;
    productId: string | null;
    input: Record<string, unknown>;
    output: object;
    model?: string;
  },
) {
  const [row] = await db
    .insert(aiGeneration)
    .values({
      organizationId: ctx.organization.id,
      userId: ctx.userId,
      productId: g.productId,
      kind: g.kind,
      model: g.model ?? TEMPLATE_MODEL,
      inputHash: "",
      input: g.input,
      output: g.output,
    })
    .returning({ id: aiGeneration.id });
  return row.id;
}

/** Nombre de résultats déjà produits pour ce produit et cet outil (fait varier la version suivante). */
export async function generationCount(ctx: OrgContext, kind: string, productId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(aiGeneration)
    .where(
      and(
        eq(aiGeneration.organizationId, ctx.organization.id),
        eq(aiGeneration.productId, productId),
        eq(aiGeneration.kind, kind),
      ),
    );
  return row?.n ?? 0;
}

/** Dernière génération d'un type pour un produit de l'entreprise. */
export async function latestGeneration(ctx: OrgContext, kind: string, productId: string) {
  const [row] = await db
    .select()
    .from(aiGeneration)
    .where(
      and(
        eq(aiGeneration.organizationId, ctx.organization.id),
        eq(aiGeneration.productId, productId),
        eq(aiGeneration.kind, kind),
      ),
    )
    .orderBy(desc(aiGeneration.createdAt))
    .limit(1);
  return row ?? null;
}

/** Historique des générations de l'entreprise (option : un type, un produit). */
export async function listGenerations(
  ctx: OrgContext,
  filter: { kind?: string; productId?: string; limit?: number } = {},
) {
  const conds = [eq(aiGeneration.organizationId, ctx.organization.id)];
  if (filter.kind) conds.push(eq(aiGeneration.kind, filter.kind));
  if (filter.productId) conds.push(eq(aiGeneration.productId, filter.productId));
  return db
    .select()
    .from(aiGeneration)
    .where(and(...conds))
    .orderBy(desc(aiGeneration.createdAt))
    .limit(filter.limit ?? 50);
}

/** Une génération de l'entreprise par son identifiant (jamais celle d'une autre entreprise). */
export async function getGeneration(ctx: OrgContext, id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db
    .select()
    .from(aiGeneration)
    .where(and(eq(aiGeneration.organizationId, ctx.organization.id), eq(aiGeneration.id, id)));
  return row ?? null;
}
