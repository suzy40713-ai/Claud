"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/server/auth/session";
import { runAction } from "@/server/errors";
import {
  cancelInvitation,
  changeMemberRole,
  inviteMember,
  removeMember,
  resendInvitation,
} from "@/server/team/service";

const PATH = "/tableau-de-bord/equipe";

export async function inviteAction(input: { email: string; role: string }) {
  const ctx = await requireOrg();
  const res = await runAction(async () => {
    await inviteMember(ctx, input as { email: string; role: "admin" | "employee" });
  }, `Invitation envoyée à ${input.email}.`);
  revalidatePath(PATH);
  return res;
}

export async function resendInvitationAction(id: string) {
  const ctx = await requireOrg();
  return runAction(() => resendInvitation(ctx, id), "Invitation renvoyée.");
}

export async function cancelInvitationAction(id: string) {
  const ctx = await requireOrg();
  const res = await runAction(() => cancelInvitation(ctx, id), "Invitation annulée.");
  revalidatePath(PATH);
  return res;
}

export async function changeRoleAction(memberId: string, role: string) {
  const ctx = await requireOrg();
  const res = await runAction(() => changeMemberRole(ctx, memberId, role), "Rôle modifié.");
  revalidatePath(PATH);
  return res;
}

export async function removeMemberAction(memberId: string) {
  const ctx = await requireOrg();
  const res = await runAction(() => removeMember(ctx, memberId), "Membre retiré de l'équipe.");
  revalidatePath(PATH);
  return res;
}
