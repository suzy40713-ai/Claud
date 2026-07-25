import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { db } from "../db/client.js";
import { clips, processingJobs, videos } from "../db/schema.js";
import { reserveMinutes } from "../lib/usage.js";
import { requireInternalSecret } from "../middleware/internalAuth.js";

const statusSchema = z.object({
  status: z.enum(["uploaded", "queued", "processing", "completed", "failed"]),
  errorMessage: z.string().optional(),
});

const durationSchema = z.object({
  durationSeconds: z.number().positive(),
});

const clipSchema = z.object({
  startTime: z.number().nonnegative(),
  endTime: z.number().positive(),
  durationSeconds: z.number().positive(),
  score: z.number().optional(),
  captionText: z.string().optional(),
  storageKey: z.string().min(1),
  thumbnailKey: z.string().optional(),
});

const jobSchema = z.object({
  videoId: z.string().uuid(),
  bullmqJobId: z.string().min(1),
  status: z.enum(["waiting", "active", "completed", "failed"]),
  progress: z.number().min(0).max(100).default(0),
  errorMessage: z.string().optional(),
});

async function getVideoOrThrow(id: string) {
  const [video] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return video ?? null;
}

export async function internalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireInternalSecret);

  app.patch("/videos/:id/status", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = statusSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message);
    }

    const video = await getVideoOrThrow(id);
    if (!video) {
      return reply.notFound();
    }

    await db
      .update(videos)
      .set({ status: parsed.data.status, errorMessage: parsed.data.errorMessage ?? null })
      .where(eq(videos.id, id));

    return { ok: true };
  });

  app.post("/videos/:id/duration", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = durationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message);
    }

    const video = await getVideoOrThrow(id);
    if (!video) {
      return reply.notFound();
    }

    await db
      .update(videos)
      .set({ durationSeconds: parsed.data.durationSeconds })
      .where(eq(videos.id, id));

    const reservation = await reserveMinutes(video.userId, parsed.data.durationSeconds / 60);

    if (!reservation.allowed) {
      await db
        .update(videos)
        .set({ status: "failed", errorMessage: "quota_exceeded" })
        .where(eq(videos.id, id));
    }

    return reservation;
  });

  app.post("/videos/:id/clips", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = clipSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message);
    }

    const video = await getVideoOrThrow(id);
    if (!video) {
      return reply.notFound();
    }

    const [created] = await db
      .insert(clips)
      .values({
        videoId: id,
        userId: video.userId,
        storageKey: parsed.data.storageKey,
        thumbnailKey: parsed.data.thumbnailKey,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        durationSeconds: parsed.data.durationSeconds,
        score: parsed.data.score,
        captionText: parsed.data.captionText,
      })
      .returning();

    return created;
  });

  app.patch("/jobs", async (request, reply) => {
    const parsed = jobSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message);
    }

    const [existing] = await db
      .select({ id: processingJobs.id })
      .from(processingJobs)
      .where(eq(processingJobs.bullmqJobId, parsed.data.bullmqJobId))
      .limit(1);

    const now = new Date();
    const isTerminal = parsed.data.status === "completed" || parsed.data.status === "failed";

    if (existing) {
      await db
        .update(processingJobs)
        .set({
          status: parsed.data.status,
          progress: parsed.data.progress,
          errorMessage: parsed.data.errorMessage ?? null,
          finishedAt: isTerminal ? now : null,
        })
        .where(eq(processingJobs.id, existing.id));
      return { ok: true };
    }

    await db.insert(processingJobs).values({
      videoId: parsed.data.videoId,
      bullmqJobId: parsed.data.bullmqJobId,
      status: parsed.data.status,
      progress: parsed.data.progress,
      startedAt: now,
      errorMessage: parsed.data.errorMessage ?? null,
    });

    return { ok: true };
  });
}
