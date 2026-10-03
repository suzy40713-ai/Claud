"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAccountOrThrow } from "@/lib/account";
import { UserFacingError, toActionError, type ActionResult } from "@/lib/errors";
import { hasFeature } from "@/lib/plans";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

const collectionSchema = z.object({
  name: z.string().trim().min(1, "Donne un nom à ta collection.").max(80),
  description: z.string().trim().max(500).optional(),
  niche: z.string().max(40).optional().nullable(),
  teamId: uuid.optional().nullable(),
});

export async function createCollection(input: z.infer<typeof collectionSchema>): Promise<ActionResult<{ id: string }>> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const parsed = collectionSchema.safeParse(input);
    if (!parsed.success) throw new UserFacingError(parsed.error.issues[0]?.message ?? "Données invalides.");
    const { name, description, niche, teamId } = parsed.data;

    const admin = createAdminClient();
    // Plan limit enforced server-side (collections have no insert policy for users).
    const max = account.plan.limits.collections_max;
    if (max >= 0) {
      const { count } = await admin.from("collections").select("id", { count: "exact", head: true }).eq("user_id", userId);
      if ((count ?? 0) >= max) {
        throw new UserFacingError(
          `Ta formule ${account.plan.name} est limitée à ${max} collection${max > 1 ? "s" : ""}. Passe à Pro pour des collections illimitées.`,
          "plan_required"
        );
      }
    }
    if (teamId) {
      if (!hasFeature(account.plan.features, "teams")) throw new UserFacingError("Les collections d'équipe sont réservées à la formule Business.", "plan_required");
      const { data: member } = await admin.from("team_members").select("team_id").eq("team_id", teamId).eq("user_id", userId).maybeSingle();
      if (!member) throw new UserFacingError("Tu ne fais pas partie de cette équipe.", "forbidden");
    }

    const { data, error } = await admin
      .from("collections")
      .insert({ user_id: userId, name, description: description || null, niche: niche || null, team_id: teamId ?? null })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath("/app/collections");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    return toActionError("createCollection", error, userId);
  }
}

export async function updateCollection(id: string, input: Omit<z.infer<typeof collectionSchema>, "teamId">): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const parsed = collectionSchema.omit({ teamId: true }).safeParse(input);
    if (!parsed.success) throw new UserFacingError(parsed.error.issues[0]?.message ?? "Données invalides.");
    const supabase = await createClient();
    const { error } = await supabase
      .from("collections")
      .update({ name: parsed.data.name, description: parsed.data.description || null, niche: parsed.data.niche || null })
      .eq("id", uuid.parse(id))
      .eq("user_id", userId);
    if (error) throw error;
    revalidatePath(`/app/collections/${id}`);
    revalidatePath("/app/collections");
    return { ok: true };
  } catch (error) {
    return toActionError("updateCollection", error, userId);
  }
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const supabase = await createClient();
    const { error } = await supabase.from("collections").delete().eq("id", uuid.parse(id)).eq("user_id", userId);
    if (error) throw error;
    revalidatePath("/app/collections");
    return { ok: true };
  } catch (error) {
    return toActionError("deleteCollection", error, userId);
  }
}

export async function addToCollection(collectionId: string, adId: string): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const supabase = await createClient();
    // RLS checks that the user can access the collection (own or team).
    const { error } = await supabase
      .from("collection_items")
      .upsert(
        { collection_id: uuid.parse(collectionId), ad_id: uuid.parse(adId), added_by: userId },
        { onConflict: "collection_id,ad_id", ignoreDuplicates: true }
      );
    if (error) throw new UserFacingError("Impossible d'ajouter cette publicité à la collection.", "forbidden");
    revalidatePath(`/app/collections/${collectionId}`);
    return { ok: true };
  } catch (error) {
    return toActionError("addToCollection", error, userId);
  }
}

export async function removeFromCollection(collectionId: string, adId: string): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const supabase = await createClient();
    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", uuid.parse(collectionId))
      .eq("ad_id", uuid.parse(adId));
    if (error) throw error;
    revalidatePath(`/app/collections/${collectionId}`);
    return { ok: true };
  } catch (error) {
    return toActionError("removeFromCollection", error, userId);
  }
}

export async function updateCollectionItemNote(itemId: string, note: string): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const supabase = await createClient();
    const { error } = await supabase
      .from("collection_items")
      .update({ note: note.trim().slice(0, 2000) || null })
      .eq("id", uuid.parse(itemId));
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return toActionError("updateCollectionItemNote", error, userId);
  }
}
