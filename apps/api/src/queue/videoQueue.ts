import { Queue } from "bullmq";
import { Redis } from "ioredis";

import { env } from "../config/env.js";

export const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const VIDEO_PROCESSING_QUEUE = "video-processing";

export const videoQueue = new Queue(VIDEO_PROCESSING_QUEUE, { connection });

export type VideoProcessingJobData = {
  videoId: string;
  userId: string;
  storageKey: string;
  originalFilename: string;
};

export async function enqueueVideoProcessing(data: VideoProcessingJobData) {
  return videoQueue.add("process-video", data, {
    attempts: 2,
    backoff: { type: "exponential", delay: 30_000 },
    removeOnComplete: { age: 60 * 60 * 24 * 7 },
    removeOnFail: { age: 60 * 60 * 24 * 30 },
  });
}
