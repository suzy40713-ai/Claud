import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { organization, product } from "@/db/schema";
import { hasRoom, LIMIT_MESSAGES, PlanLimitError } from "@/domain/billing/plans";
import { findIdea, ideaToProduct } from "@/domain/launch/ideas";
import { productSchema, type ProductInput } from "@/domain/marketing/product";
import { assertCan } from "@/domain/permissions";
import type { OrgContext } from "@/server/auth/session";
import { UserError } from "@/server/errors";

export type ProductRow = typeof product.$inferSelect;

export async function countProducts(organizationId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(product)
    .where(eq(product.organizationId, organizationId));
  return row?.n ?? 0;
}

export async function listProducts(ctx: OrgContext) {
  assertCan(ctx.role, "marketing.manage");
  return db
    .select()
    .from(product)
    .where(eq(product.organizationId, ctx.organization.id))
    .orderBy(desc(product.createdAt));
}

/** Un produit de l'entreprise courante (jamais celui d'une autre entreprise). */
export async function getProduct(ctx: OrgContext, id: string) {
  assertCan(ctx.role, "marketing.manage");
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db
    .select()
    .from(product)
    .where(and(eq(product.organizationId, ctx.organization.id), eq(product.id, id)));
  return row ?? null;
}

export async function createProduct(ctx: OrgContext, input: ProductInput) {
  assertCan(ctx.role, "marketing.manage");
  const data = productSchema.parse(input);
  return db.transaction(async (tx) => {
    // Verrou sur l'entreprise : deux ajouts simultanés ne dépassent pas la limite du forfait.
    await tx
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.id, ctx.organization.id))
      .for("update");
    const [{ n }] = await tx
      .select({ n: count() })
      .from(product)
      .where(eq(product.organizationId, ctx.organization.id));
    if (!hasRoom(ctx.plan.limits.products, n))
      throw new PlanLimitError("products", LIMIT_MESSAGES.products(ctx.plan));
    const [row] = await tx
      .insert(product)
      .values({ ...data, organizationId: ctx.organization.id, createdByUserId: ctx.userId })
      .returning();
    return row;
  });
}

export async function updateProduct(ctx: OrgContext, id: string, input: ProductInput) {
  assertCan(ctx.role, "marketing.manage");
  const data = productSchema.parse(input);
  const [row] = await db
    .update(product)
    .set(data)
    .where(and(eq(product.organizationId, ctx.organization.id), eq(product.id, id)))
    .returning();
  if (!row) throw new UserError("Produit introuvable.");
  return row;
}

export async function deleteProduct(ctx: OrgContext, id: string) {
  assertCan(ctx.role, "marketing.manage");
  const [row] = await db
    .delete(product)
    .where(and(eq(product.organizationId, ctx.organization.id), eq(product.id, id)))
    .returning({ id: product.id });
  if (!row) throw new UserError("Produit introuvable.");
}

/** Module rendez-vous (agenda, réservations…) activé ou non pour l'entreprise. */
export async function setBookingModule(ctx: OrgContext, enabled: boolean) {
  assertCan(ctx.role, "organization.update");
  await db
    .update(organization)
    .set({ bookingModule: enabled })
    .where(eq(organization.id, ctx.organization.id));
}

/** Transforme une idée de « Trouver une idée » en premier produit (fiche pré-remplie). */
export async function createProductFromIdea(ctx: OrgContext, ideaId: string) {
  const idea = findIdea(ideaId);
  if (!idea) throw new UserError("Idée introuvable.");
  return createProduct(ctx, ideaToProduct(idea));
}
