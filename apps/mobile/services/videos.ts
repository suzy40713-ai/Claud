import { File } from "expo-file-system";

import { apiRequest } from "./api";

export type VideoStatus = "uploaded" | "queued" | "processing" | "completed" | "failed";
export type ClipStatus = "generated" | "exported" | "deleted";

export type Video = {
  id: string;
  originalFilename: string;
  durationSeconds: number | null;
  status: VideoStatus;
  errorMessage: string | null;
  createdAt: string;
};

export type Clip = {
  id: string;
  videoId: string;
  storageKey: string | null;
  thumbnailKey: string | null;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  score: number | null;
  captionText: string | null;
  status: ClipStatus;
  createdAt: string;
};

export type VideoWithClips = Video & { clips: Clip[] };

type GetToken = () => Promise<string | null>;

export class QuotaExceededError extends Error {
  constructor() {
    super("quota_exceeded");
  }
}

export async function createVideo(
  getToken: GetToken,
  params: { filename: string; contentType: string },
) {
  try {
    return await apiRequest<{ videoId: string; uploadUrl: string; storageKey: string }>("/api/videos", {
      method: "POST",
      body: params,
      getToken,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("quota_exceeded")) {
      throw new QuotaExceededError();
    }
    throw err;
  }
}

export async function uploadVideoFile(uploadUrl: string, fileUri: string, contentType: string) {
  const file = new File(fileUri);
  const result = await file.upload(uploadUrl, {
    httpMethod: "PUT",
    headers: { "Content-Type": contentType },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Échec de l'upload (statut ${result.status})`);
  }
}

export function startProcessing(getToken: GetToken, videoId: string) {
  return apiRequest<{ status: string }>(`/api/videos/${videoId}/process`, { method: "POST", getToken });
}

export function listVideos(getToken: GetToken) {
  return apiRequest<Video[]>("/api/videos", { getToken });
}

export function getVideo(getToken: GetToken, videoId: string) {
  return apiRequest<VideoWithClips>(`/api/videos/${videoId}`, { getToken });
}

export function deleteClip(getToken: GetToken, clipId: string) {
  return apiRequest<void>(`/api/clips/${clipId}`, { method: "DELETE", getToken });
}

export function getClipDownloadUrl(getToken: GetToken, clipId: string) {
  return apiRequest<{ downloadUrl: string; thumbnailUrl: string | null }>(
    `/api/clips/${clipId}/download-url`,
    { getToken },
  );
}
