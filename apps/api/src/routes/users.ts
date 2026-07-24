import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import { db } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
import { subscriptions, usage, users } from "../db/schema.js";

export async function userRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: requireAuth }, async (request, reply) => {
    const [user] = await db.select().from(users).where(eq(users.id, request.userId)).limit(1);

    if (!user) {
      return reply.notFound();
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, request.userId))
      .limit(1);

    const [currentUsage] = await db
      .select()
      .from(usage)
      .where(eq(usage.userId, request.userId))
      .orderBy(usage.periodStart)
      .limit(1);

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            minutesQuota: subscription.minutesQuota,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
      minutesUsed: currentUsage?.minutesUsed ?? 0,
    };
  });
}
