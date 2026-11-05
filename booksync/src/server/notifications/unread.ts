import "server-only";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { notification } from "@/db/schema";
import type { OrgContext } from "@/server/auth/session";

/** Notifications internes non lues destinées à l'utilisateur courant dans l'entreprise active. */
export async function countUnread(ctx: OrgContext) {
  const [row] = await db
    .select({ n: count() })
    .from(notification)
    .where(
      and(
        eq(notification.organizationId, ctx.organization.id),
        eq(notification.audience, "staff"),
        eq(notification.recipient, ctx.user.email.toLowerCase()),
        isNull(notification.readAt),
      ),
    );
  return row?.n ?? 0;
}
