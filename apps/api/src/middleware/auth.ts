import { createClerkClient, verifyToken } from "@clerk/backend";
import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";

import { env } from "../config/env.js";
import { db } from "../db/client.js";
import { subscriptions, users } from "../db/schema.js";

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

const FREE_PLAN_MINUTES = 30;

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
}

async function ensureUser(externalAuthId: string) {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.externalAuthId, externalAuthId))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const clerkUser = await clerkClient.users.getUser(externalAuthId);
  const email = clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error(`Clerk user ${externalAuthId} has no email address`);
  }

  const [created] = await db
    .insert(users)
    .values({
      externalAuthId,
      email,
      displayName: clerkUser.firstName ?? undefined,
      avatarUrl: clerkUser.imageUrl,
    })
    .returning({ id: users.id });

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db.insert(subscriptions).values({
    userId: created.id,
    plan: "free",
    minutesQuota: FREE_PLAN_MINUTES,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
  });

  return created.id;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token) {
    return reply.unauthorized("Missing bearer token");
  }

  try {
    const verified = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
    request.userId = await ensureUser(verified.sub);
  } catch {
    return reply.unauthorized("Invalid or expired token");
  }
}
