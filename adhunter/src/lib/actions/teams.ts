"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertFeature, requireAccountOrThrow } from "@/lib/account";
import { UserFacingError, toActionError, type ActionResult } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/server";

const MAX_MEMBERS = 10;

export async function createTeam(name: string): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    assertFeature(account, "teams");
    const clean = z.string().trim().min(2, "Le nom doit faire au moins 2 caractères.").max(60).safeParse(name);
    if (!clean.success) throw new UserFacingError(clean.error.issues[0].message);
    const admin = createAdminClient();
    const { data: existing } = await admin.from("teams").select("id").eq("owner_id", userId).maybeSingle();
    if (existing) throw new UserFacingError("Tu as déjà créé une équipe.");
    const { data: team, error } = await admin.from("teams").insert({ name: clean.data, owner_id: userId }).select("id").single();
    if (error) throw error;
    await admin.from("team_members").insert({ team_id: team.id, user_id: userId, role: "owner" });
    revalidatePath("/app/team");
    return { ok: true };
  } catch (error) {
    return toActionError("createTeam", error, userId);
  }
}

/** Adds an existing user directly, otherwise records a pending invitation claimed at their next visit. */
export async function inviteMember(teamId: string, email: string): Promise<ActionResult<{ pending: boolean }>> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    assertFeature(account, "teams");
    const cleanEmail = z.string().trim().toLowerCase().email("Adresse email invalide.").safeParse(email);
    if (!cleanEmail.success) throw new UserFacingError(cleanEmail.error.issues[0].message);
    const admin = createAdminClient();
    const { data: team } = await admin.from("teams").select("id, owner_id").eq("id", z.string().uuid().parse(teamId)).maybeSingle();
    if (!team || team.owner_id !== userId) throw new UserFacingError("Seul le propriétaire peut inviter des membres.", "forbidden");

    const { count } = await admin.from("team_members").select("user_id", { count: "exact", head: true }).eq("team_id", team.id);
    if ((count ?? 0) >= MAX_MEMBERS) throw new UserFacingError(`Une équipe peut compter jusqu'à ${MAX_MEMBERS} membres.`);

    const { data: profile } = await admin.from("profiles").select("id").eq("email", cleanEmail.data).maybeSingle();
    if (profile) {
      await admin.from("team_members").upsert({ team_id: team.id, user_id: profile.id, role: "member" }, { onConflict: "team_id,user_id", ignoreDuplicates: true });
      await admin.from("team_invitations").upsert(
        { team_id: team.id, email: cleanEmail.data, invited_by: userId, accepted_at: new Date().toISOString() },
        { onConflict: "team_id,email" }
      );
      revalidatePath("/app/team");
      return { ok: true, data: { pending: false } };
    }
    await admin.from("team_invitations").upsert({ team_id: team.id, email: cleanEmail.data, invited_by: userId }, { onConflict: "team_id,email" });
    revalidatePath("/app/team");
    return { ok: true, data: { pending: true } };
  } catch (error) {
    return toActionError("inviteMember", error, userId);
  }
}

export async function removeMember(teamId: string, memberId: string): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const admin = createAdminClient();
    const { data: team } = await admin.from("teams").select("owner_id").eq("id", z.string().uuid().parse(teamId)).maybeSingle();
    if (!team) throw new UserFacingError("Équipe introuvable.");
    const isOwner = team.owner_id === userId;
    // Owner removes anyone but themselves; members can leave.
    if (!(isOwner && memberId !== userId) && !(memberId === userId && !isOwner)) {
      throw new UserFacingError("Action non autorisée.", "forbidden");
    }
    await admin.from("team_members").delete().eq("team_id", teamId).eq("user_id", memberId);
    revalidatePath("/app/team");
    return { ok: true };
  } catch (error) {
    return toActionError("removeMember", error, userId);
  }
}

export async function cancelInvitation(invitationId: string): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const account = await requireAccountOrThrow();
    userId = account.user.id;
    const admin = createAdminClient();
    const { data: inv } = await admin.from("team_invitations").select("team_id").eq("id", z.string().uuid().parse(invitationId)).maybeSingle();
    if (!inv) throw new UserFacingError("Invitation introuvable.");
    const { data: team } = await admin.from("teams").select("owner_id").eq("id", inv.team_id).maybeSingle();
    if (team?.owner_id !== userId) throw new UserFacingError("Action non autorisée.", "forbidden");
    await admin.from("team_invitations").delete().eq("id", invitationId);
    revalidatePath("/app/team");
    return { ok: true };
  } catch (error) {
    return toActionError("cancelInvitation", error, userId);
  }
}
