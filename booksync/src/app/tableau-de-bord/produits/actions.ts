"use server";

import { revalidatePath } from "next/cache";
import type { ProductInput } from "@/domain/marketing/product";
import { requireOrg } from "@/server/auth/session";
import { runAction, UserError } from "@/server/errors";
import { rateLimit } from "@/server/rate-limit";
import {
  createProduct,
  createProductFromIdea,
  deleteProduct,
  updateProduct,
} from "@/server/marketing/products";
import { analyzeProduct } from "@/server/marketing/analysis";

export async function createProductAction(input: ProductInput) {
  const ctx = await requireOrg();
  const res = await runAction(
    async () => ({ id: (await createProduct(ctx, input)).id }),
    "Produit ajouté.",
  );
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

export async function updateProductAction(id: string, input: ProductInput) {
  const ctx = await requireOrg();
  const res = await runAction(
    async () => ({ id: (await updateProduct(ctx, id, input)).id }),
    "Produit enregistré.",
  );
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

export async function deleteProductAction(id: string) {
  const ctx = await requireOrg();
  const res = await runAction(() => deleteProduct(ctx, id), "Produit supprimé.");
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}

export async function analyzeProductAction(id: string) {
  const ctx = await requireOrg();
  const res = await runAction(async () => {
    if (!rateLimit(`tools:${ctx.userId}`, 10, 60_000))
      throw new UserError("Trop de demandes d'affilée. Patientez une minute.");
    const r = await analyzeProduct(ctx, id);
    return { id: r.id };
  }, "Analyse terminée.");
  revalidatePath(`/tableau-de-bord/produits/${id}`);
  revalidatePath("/tableau-de-bord/analyse-produit");
  return res;
}

export async function createProductFromIdeaAction(ideaId: string) {
  const ctx = await requireOrg();
  const res = await runAction(
    async () => ({ id: (await createProductFromIdea(ctx, ideaId)).id }),
    "Idée enregistrée comme produit.",
  );
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}
