import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

import { env } from "../config/env.js";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

const UPLOAD_URL_TTL_SECONDS = 15 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 60 * 60;

export function buildVideoStorageKey(userId: string, videoId: string, originalFilename: string) {
  const extension = originalFilename.includes(".") ? originalFilename.split(".").pop() : "mp4";
  return `videos/${userId}/${videoId}.${extension}`;
}

export function buildClipStorageKey(userId: string, videoId: string, clipId: string) {
  return `clips/${userId}/${videoId}/${clipId}.mp4`;
}

export function buildThumbnailStorageKey(userId: string, videoId: string, clipId: string) {
  return `clips/${userId}/${videoId}/${clipId}-thumb.jpg`;
}

export async function getUploadUrl(storageKey: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: storageKey,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
}

export async function getDownloadUrl(storageKey: string) {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: storageKey,
  });
  return getSignedUrl(r2Client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
}

export function generateId() {
  return randomUUID();
}
