import { and, desc, eq, ne } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { db } from "../db/client.js";
import { clips, videos } from "../db/schema.js";
import { buildVideoStorageKey, getDownloadUrl, getUploadUrl } from "../lib/storage.js";
import { hasRemainingQuota } from "../lib/usage.js";
import { requireAuth } from "../middleware/auth.js";
import { enqueueVideoProcessing } from "../queue/videoQueue.js";

const ALLOWED_CONTENT_TYPES = new Set(["video/mp4", "video/quicktime", "video/x-m4v"]);

const createVideoSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().refine((value) => ALLOWED_CONTENT_TYPES.has(value), {
    message: "Format vidéo non supporté (mp4, mov)",
  }),
});

export async function videoRoutes(app: FastifyInstance) {
  app.post("/videos", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = createVideoSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.issues[0]?.message ?? "Requête invalide");
    }

    if (!(await hasRemainingQuota(request.userId))) {
      return reply.code(402).send({ error: "quota_exceeded" });
    }

    const [created] = await db
      .insert(videos)
      .values({
        userId: request.userId,
        originalFilename: parsed.data.filename,
        storageKey: "",
        status: "uploaded",
      })
      .returning();

    const storageKey = buildVideoStorageKey(request.userId, created.id, parsed.data.filename);

    await db.update(videos).set({ storageKey }).where(eq(videos.id, created.id));

    const uploadUrl = await getUploadUrl(storageKey, parsed.data.contentType);

    return { videoId: created.id, uploadUrl, storageKey };
  });

  app.post("/videos/:id/process", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, request.userId)))
      .limit(1);

    if (!video) {
      return reply.notFound();
    }

    if (video.status !== "uploaded") {
      return reply.badRequest(`Vidéo déjà en statut "${video.status}"`);
    }

    await db.update(videos).set({ status: "queued" }).where(eq(videos.id, id));

    await enqueueVideoProcessing({
      videoId: video.id,
      userId: request.userId,
      storageKey: video.storageKey,
      originalFilename: video.originalFilename,
    });

    return { status: "queued" };
  });

  app.get("/videos", { preHandler: requireAuth }, async (request) => {
    return db
      .select()
      .from(videos)
      .where(eq(videos.userId, request.userId))
      .orderBy(desc(videos.createdAt));
  });

  app.get("/videos/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, request.userId)))
      .limit(1);

    if (!video) {
      return reply.notFound();
    }

    const videoClips = await db
      .select()
      .from(clips)
      .where(and(eq(clips.videoId, id), ne(clips.status, "deleted")))
      .orderBy(desc(clips.score));

    return { ...video, clips: videoClips };
  });

  app.delete("/clips/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [clip] = await db
      .select({ id: clips.id })
      .from(clips)
      .where(and(eq(clips.id, id), eq(clips.userId, request.userId)))
      .limit(1);

    if (!clip) {
      return reply.notFound();
    }

    await db.update(clips).set({ status: "deleted" }).where(eq(clips.id, id));

    return reply.code(204).send();
  });

  app.get("/clips/:id/download-url", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const [clip] = await db
      .select()
      .from(clips)
      .where(and(eq(clips.id, id), eq(clips.userId, request.userId)))
      .limit(1);

    if (!clip || !clip.storageKey) {
      return reply.notFound();
    }

    const downloadUrl = await getDownloadUrl(clip.storageKey);
    const thumbnailUrl = clip.thumbnailKey ? await getDownloadUrl(clip.thumbnailKey) : null;
    return { downloadUrl, thumbnailUrl };
  });
}
