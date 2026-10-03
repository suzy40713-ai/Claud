"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAccountOrThrow } from "@/lib/account";
import { toActionError, type ActionResult } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

export async function toggleFavorite(adId: string): Promise<ActionResult<{ saved: boolean }>> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const id = uuid.parse(adId);
    const supabase = await createClient();
    const { data: existing } = await supabase.from("saved_ads").select("id").eq("ad_id", id).eq("user_id", userId).maybeSingle();
    if (existing) {
      await supabase.from("saved_ads").delete().eq("id", existing.id);
      revalidatePath("/app/favorites");
      return { ok: true, data: { saved: false } };
    }
    const { data: ad } = await supabase.from("ads").select("niche").eq("id", id).maybeSingle();
    const { error } = await supabase.from("saved_ads").insert({ user_id: userId, ad_id: id, niche: ad?.niche ?? null });
    if (error) throw error;
    revalidatePath("/app/favorites");
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionError("toggleFavorite", error, userId);
  }
}

const noteSchema = z.object({ adId: uuid, note: z.string().max(2000), niche: z.string().max(40).nullable().optional() });

export async function updateFavorite(input: z.infer<typeof noteSchema>): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const { adId, note, niche } = noteSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase
      .from("saved_ads")
      .update({ note: note.trim() || null, ...(niche !== undefined ? { niche } : {}) })
      .eq("ad_id", adId)
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/app/favorites");
    return { ok: true };
  } catch (error) {
    return toActionError("updateFavorite", error, userId);
  }
}

export async function clearSearchHistory(): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const supabase = await createClient();
    const { error } = await supabase.from("searches").delete().eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/app/history");
    return { ok: true };
  } catch (error) {
    return toActionError("clearSearchHistory", error, userId);
  }
}
