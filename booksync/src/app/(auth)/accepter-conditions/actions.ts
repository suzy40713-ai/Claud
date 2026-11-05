"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { safeRedirect } from "@/lib/auth-errors";
import { TERMS_VERSION } from "@/lib/legal";
import { getSession, listMemberships } from "@/server/auth/session";

export async function acceptTermsAction(accepted: boolean, redirection: string | null) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (!accepted)
    return {
      ok: false as const,
      error: "Vous devez accepter les conditions générales pour continuer.",
    };
  if (!session.user.termsAcceptedAt) {
    await db
      .update(user)
      .set({ termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION })
      .where(eq(user.id, session.user.id));
  }
  const memberships = await listMemberships(session.user.id);
  const fallback = memberships.length ? "/tableau-de-bord" : "/onboarding";
  const target = safeRedirect(redirection, fallback);
  redirect(
    (target === "/tableau-de-bord" && !memberships.length ? "/onboarding" : target) as Route,
  );
}
