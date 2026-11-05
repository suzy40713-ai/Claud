"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVE_ORG_COOKIE, getSession } from "@/server/auth/session";
import { runAction } from "@/server/errors";
import { acceptInvitation, declineInvitation } from "@/server/team/service";

export async function acceptInvitationAction(token: string) {
  const session = await getSession();
  if (!session)
    redirect(`/connexion?redirection=${encodeURIComponent(`/invitation/${token}`)}` as never);
  const res = await runAction(() => acceptInvitation(token, session.user));
  if (!res.ok) return res;
  (await cookies()).set(ACTIVE_ORG_COOKIE, res.data.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect(session.user.termsAcceptedAt ? "/tableau-de-bord" : ("/accepter-conditions" as never));
}

export async function declineInvitationAction(token: string) {
  return runAction(() => declineInvitation(token), "Invitation refusée.");
}
