const MAX_FRAME_WIDTH = 480;

/**
 * Extrait `count` images JPEG regulierement espacees dans la duree d'une
 * video enregistree, en s'appuyant sur un <video> hors DOM + <canvas>
 * (aucune bibliotheque externe necessaire). Redimensionne pour limiter la
 * taille des donnees envoyees au serveur.
 */
export async function extractFrames(videoBlob: Blob, count: number): Promise<Blob[]> {
  const url = URL.createObjectURL(videoBlob);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Impossible de lire la video enregistree."));
    });

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Video enregistree invalide (duree inconnue).");
    }

    const scale = Math.min(1, MAX_FRAME_WIDTH / (video.videoWidth || MAX_FRAME_WIDTH));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round((video.videoWidth || MAX_FRAME_WIDTH) * scale);
    canvas.height = Math.round((video.videoHeight || MAX_FRAME_WIDTH) * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Extraction d'image indisponible sur ce navigateur.");
    }

    const frames: Blob[] = [];
    for (let i = 0; i < count; i++) {
      const t = ((i + 0.5) / count) * duration;
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("Erreur pendant l'extraction d'une image de la video."));
        video.currentTime = t;
      });

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.75));
      if (blob) frames.push(blob);
    }

    if (frames.length === 0) {
      throw new Error("Aucune image n'a pu etre extraite de la video.");
    }
    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const CANDIDATE_MIME_TYPES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return CANDIDATE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}
