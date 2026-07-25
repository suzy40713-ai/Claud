import { and, eq } from "drizzle-orm";

import { db } from "../db/client.js";
import { subscriptions, usage } from "../db/schema.js";

export async function getSubscription(userId: string) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!subscription) {
    throw new Error(`No subscription found for user ${userId}`);
  }

  return subscription;
}

export async function getOrCreateCurrentUsage(userId: string) {
  const subscription = await getSubscription(userId);

  const [existing] = await db
    .select()
    .from(usage)
    .where(and(eq(usage.userId, userId), eq(usage.periodStart, subscription.currentPeriodStart)))
    .limit(1);

  if (existing) {
    return { subscription, usageRow: existing };
  }

  const [created] = await db
    .insert(usage)
    .values({
      userId,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      minutesUsed: 0,
    })
    .returning();

  return { subscription, usageRow: created };
}

export async function hasRemainingQuota(userId: string) {
  const { subscription, usageRow } = await getOrCreateCurrentUsage(userId);
  return usageRow.minutesUsed < subscription.minutesQuota;
}

// Checks quota and commits the usage in one call; writes nothing if it would exceed the quota.
export async function reserveMinutes(userId: string, minutes: number) {
  const { subscription, usageRow } = await getOrCreateCurrentUsage(userId);
  const projected = usageRow.minutesUsed + minutes;

  if (projected > subscription.minutesQuota) {
    return { allowed: false as const, minutesUsed: usageRow.minutesUsed, minutesQuota: subscription.minutesQuota };
  }

  const [updated] = await db
    .update(usage)
    .set({ minutesUsed: projected, updatedAt: new Date() })
    .where(eq(usage.id, usageRow.id))
    .returning();

  return { allowed: true as const, minutesUsed: updated.minutesUsed, minutesQuota: subscription.minutesQuota };
}
