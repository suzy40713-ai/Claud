"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertFeature, assertFlag, consumeQuota, refundQuota, requireAccountOrThrow, type Account } from "@/lib/account";
import { demoAnalysis, demoCreation } from "@/lib/ai/demo";
import { creationSchema, creatorInputSchema, type AdAnalysis, type AdCreation, type CreatorInput } from "@/lib/ai/schemas";
import { analyzeAd, createAds } from "@/lib/ai/tasks";
import { integrations, isDemoMode } from "@/lib/env";
import { UserFacingError, toActionError, type ActionResult } from "@/lib/errors";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

function ensureAiAvailable() {
  if (!integrations.ai() && !isDemoMode()) {
    throw new UserFacingError(
      "L'assistant IA est en préparation : la clé API n'est pas encore configurée sur cette instance.",
      "not_configured"
    );
  }
}

async function withQuota<T>(account: Account, kind: "analysis" | "creation", run: () => Promise<T>): Promise<T> {
  await consumeQuota(account, kind);
  try {
    return await run();
  } catch (error) {
    await refundQuota(account, kind); // failed generations are not counted
    throw error;
  }
}

export async function analyzeAdAction(
  adId: string,
  focus?: string
): Promise<ActionResult<{ id: string; result: AdAnalysis; isDemo: boolean }>> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    await assertFlag("ai_analyzer", "L'analyse IA");
    ensureAiAvailable();

    const supabase = await createClient();
    const { data: ad } = await supabase.from("ads").select("*").eq("id", uuid.parse(adId)).maybeSingle();
    if (!ad) throw new UserFacingError("Cette publicité est introuvable.");

    const useDemo = !integrations.ai();
    const { result, model } = await withQuota(account, "analysis", async () => {
      if (useDemo) return { result: demoAnalysis(ad), model: "demo" };
      const out = await analyzeAd(ad, focus?.trim() || undefined);
      return { result: out.data, model: out.model };
    });

    const { data: saved, error } = await createAdminClient()
      .from("ai_analyses")
      .insert({ user_id: userId, ad_id: ad.id, result, model, is_demo: useDemo })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app");
    return { ok: true, data: { id: saved.id, result, isDemo: useDemo } };
  } catch (error) {
    return toActionError("analyzeAd", error, userId);
  }
}

export async function createAdsAction(
  input: CreatorInput
): Promise<ActionResult<{ id: string; result: AdCreation; isDemo: boolean }>> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    assertFeature(account, "ad_creator");
    await assertFlag("ai_creator", "Ad Creator");
    ensureAiAvailable();

    const parsed = creatorInputSchema.safeParse(input);
    if (!parsed.success) throw new UserFacingError(parsed.error.issues[0]?.message ?? "Formulaire incomplet.");

    const useDemo = !integrations.ai();
    const { result, model } = await withQuota(account, "creation", async () => {
      if (useDemo) return { result: demoCreation(parsed.data), model: "demo" };
      const out = await createAds(parsed.data);
      return { result: out.data, model: out.model };
    });

    const { data: saved, error } = await createAdminClient()
      .from("ai_creations")
      .insert({ user_id: userId, title: parsed.data.productName, input: parsed.data, result, model, is_demo: useDemo })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/creator");
    return { ok: true, data: { id: saved.id, result, isDemo: useDemo } };
  } catch (error) {
    return toActionError("createAds", error, userId);
  }
}

/** Saves user edits to a generated creation (the "Modifier" button). */
export async function updateCreation(id: string, title: string, result: AdCreation): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const parsed = creationSchema.safeParse(result);
    if (!parsed.success) throw new UserFacingError("Le contenu modifié est invalide.");
    const supabase = await createClient();
    const { error } = await supabase
      .from("ai_creations")
      .update({ title: title.trim().slice(0, 120) || "Sans titre", result: parsed.data })
      .eq("id", uuid.parse(id))
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/app/creator");
    return { ok: true };
  } catch (error) {
    return toActionError("updateCreation", error, userId);
  }
}

export async function deleteCreation(id: string): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const supabase = await createClient();
    const { error } = await supabase.from("ai_creations").delete().eq("id", uuid.parse(id)).eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/app/creator");
    return { ok: true };
  } catch (error) {
    return toActionError("deleteCreation", error, userId);
  }
}
