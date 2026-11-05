"use server";

import { cookies } from "next/headers";
import { ACTIVE_ORG_COOKIE, listMemberships, requireSession } from "@/server/auth/session";

export async function switchOrganizationAction(organizationId: string) {
  const session = await requireSession();
  const memberships = await listMemberships(session.user.id);
  if (!memberships.some((m) => m.organizationId === organizationId)) return { ok: false as const };
  (await cookies()).set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { ok: true as const };
}
