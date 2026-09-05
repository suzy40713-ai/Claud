import type { VideoStyle } from "@/generated/prisma/enums";
import type { SceneDraft } from "./scenes";

const STYLE_MOOD: Record<VideoStyle, string> = {
  SURVIE: "documentary style, outdoor scene, natural lighting, realistic illustration",
  SCIENCE: "clean scientific illustration, educational diagram style, soft studio lighting",
  ASTUCE: "bright modern lifestyle illustration, everyday life scene, clean flat design",
  INSOLITE: "vivid editorial illustration, curious atmosphere, vibrant colors",
};

// Pollinations has no negative-prompt param, but phrasing the prompt this way
// steers it away from photorealistic depictions of real, identifiable people
// and from graphic content, per the "no fake photos of real people, avoid
// graphic/shocking visuals" requirement.
const SAFETY_SUFFIX =
  "illustration only, no real identifiable people, no graphic violence, no blood, safe for work";

export interface VisualPrompt {
  sceneIndex: number;
  prompt: string;
}

function keywordsFrom(text: string): string {
  return text
    .replace(/^(rappel|est-ce que toi aussi|ce que peu de gens savent)\s*:?\s*/i, "")
    .replace(/[."]/g, "")
    .trim();
}

export function buildVisualPrompt(scene: SceneDraft, style: VideoStyle): VisualPrompt {
  const subject = keywordsFrom(scene.narrationText);
  const prompt = [subject, STYLE_MOOD[style], SAFETY_SUFFIX].filter(Boolean).join(", ");
  return { sceneIndex: scene.index, prompt };
}

export function buildVisualPrompts(scenes: SceneDraft[], style: VideoStyle): VisualPrompt[] {
  return scenes.map((scene) => buildVisualPrompt(scene, style));
}

export interface ImageProvider {
  fetchImage(prompt: string, opts: { width: number; height: number; seed: number }): Promise<Buffer>;
}

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

// Free, keyless, no-account text-to-image API — the same one already used
// and validated in the previous version of this project.
export const pollinationsImageProvider: ImageProvider = {
  async fetchImage(prompt, { width, height, seed }) {
    const encodedPrompt = encodeURIComponent(prompt.slice(0, 800));
    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      seed: String(seed),
      nologo: "true",
      safe: "true",
      model: "flux",
    });
    const url = `${POLLINATIONS_BASE}/${encodedPrompt}?${params.toString()}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) {
      throw new Error(`Le service de generation d'images a repondu ${res.status}`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new Error("Le service de generation d'images n'a pas renvoye une image valide");
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  },
};

function colorForPrompt(prompt: string): string {
  let hash = 0;
  for (const char of prompt) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `0x${(hash % 0xffffff).toString(16).padStart(6, "0")}`;
}

// Offline placeholder (a flat-colored frame, no network call): useful for
// local dev/testing, or as a DEMO fallback when Pollinations is unreachable.
// Select it with IMAGE_PROVIDER=local in .env.
export const localPlaceholderImageProvider: ImageProvider = {
  async fetchImage(prompt, { width, height }) {
    const { spawn } = await import("node:child_process");
    const color = colorForPrompt(prompt);
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const child = spawn("ffmpeg", [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        `color=c=${color}:s=${width}x${height}`,
        "-frames:v",
        "1",
        "-f",
        "image2",
        "-c:v",
        "mjpeg",
        "pipe:1",
      ]);
      child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
      let stderr = "";
      child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) resolve(Buffer.concat(chunks));
        else reject(new Error(`ffmpeg (image de test) a echoue: ${stderr.slice(-500)}`));
      });
    });
  },
};

/**
 * Provider abstraction: swap IMAGE_PROVIDER in .env to plug in a paid image
 * API later without touching the rest of the pipeline.
 */
export function getImageProvider(): ImageProvider {
  const provider = process.env.IMAGE_PROVIDER ?? "pollinations";
  if (provider === "pollinations") return pollinationsImageProvider;
  if (provider === "local") return localPlaceholderImageProvider;
  throw new Error(`Fournisseur d'images inconnu: ${provider}`);
}
