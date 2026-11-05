"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { member, staff, user } from "@/db/schema";
import { auth } from "@/server/auth/auth";
import { requireSession } from "@/server/auth/session";
import { deleteAccount } from "@/server/account";
import { cancelSubscriptionNow } from "@/server/billing/stripe";
import { runAction } from "@/server/errors";

export async function updateProfileAction(input: { name: string }) {
  const session = await requireSession();
  return runAction(async () => {
    const name = z.string().trim().min(2, "2 caractères minimum.").max(80, "80 caractères maximum.").parse(input.name);
    await db.transaction(async (tx) => {
      await tx.update(user).set({ name }).where(eq(user.id, session.user.id));
      // Les profils de réservation de CET utilisateur qui portaient son ancien nom suivent le changement.
      const memberIds = tx.select({ id: member.id }).from(member).where(eq(member.userId, session.user.id));
      await tx
        .update(staff)
        .set({ displayName: name })
        .where(and(inArray(staff.memberId, memberIds), eq(staff.displayName, session.user.name)));
    });
  }, "Profil mis à jour.");
}

export async function deleteAccountAction(confirmation: string) {
  const session = await requireSession();
  const res = await runAction(() => deleteAccount(session.user.id, confirmation, cancelSubscriptionNow));
  if (res.ok) await auth.api.signOut({ headers: await headers() }).catch(() => undefined);
  return res;
}
