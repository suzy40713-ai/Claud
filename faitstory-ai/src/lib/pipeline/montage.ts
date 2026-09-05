import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { VideoStyle } from "@/generated/prisma/enums";
import type { SceneTransition } from "./scenes";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args]);
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      reject(new Error(`Impossible de lancer ffmpeg (est-il installe ?) : ${err.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg a echoue (code ${code}): ${stderr.slice(-2000)}`));
    });
  });
}

/** Escapes a filesystem path for use as a ffmpeg filter option value (e.g. subtitles=<path>). */
function escapeFilterPath(filePath: string): string {
  return filePath.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

async function buildSceneClip(params: {
  imagePath: string;
  outPath: string;
  durationSec: number;
  transition: SceneTransition;
}): Promise<void> {
  const { imagePath, outPath, durationSec, transition } = params;
  const totalFrames = Math.max(Math.round(durationSec * FPS), 1);
  const zoomExpr =
    transition === "zoom-in"
      ? "min(zoom+0.0015,1.2)"
      : "if(eq(on,1),1.2,max(zoom-0.0015,1.0))";
  const filterGraph = [
    `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase`,
    `crop=${WIDTH}:${HEIGHT}`,
    `zoompan=z='${zoomExpr}':d=${totalFrames}:s=${WIDTH}x${HEIGHT}:fps=${FPS}`,
  ].join(",");

  await runFfmpeg([
    "-loop",
    "1",
    "-i",
    imagePath,
    "-t",
    String(durationSec),
    "-vf",
    filterGraph,
    "-r",
    String(FPS),
    "-pix_fmt",
    "yuv420p",
    "-c:v",
    "libx264",
    outPath,
  ]);
}

async function concatFiles(filePaths: string[], listFile: string, outPath: string): Promise<void> {
  const listContent = filePaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
  await fs.writeFile(listFile, listContent, "utf8");
  await runFfmpeg(["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outPath]);
}

const MUSIC_TONES: Record<VideoStyle, [number, number]> = {
  SURVIE: [180, 220],
  SCIENCE: [210, 260],
  ASTUCE: [200, 250],
  INSOLITE: [196, 246.94],
};

/** Fully synthesized (royalty-free by construction) ambient bed — no download, no licensing question. */
async function buildMusicBed(outPath: string, durationSec: number, style: VideoStyle): Promise<void> {
  const [freq1, freq2] = MUSIC_TONES[style];
  const fadeStart = Math.max(durationSec - 2, 0);
  await runFfmpeg([
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=${freq1}:duration=${durationSec}`,
    "-f",
    "lavfi",
    "-i",
    `sine=frequency=${freq2}:duration=${durationSec}`,
    "-filter_complex",
    `[0:a]volume=0.05[a1];[1:a]volume=0.04[a2];[a1][a2]amix=inputs=2:duration=first[amixed];[amixed]afade=t=in:st=0:d=2,afade=t=out:st=${fadeStart}:d=2[aout]`,
    "-map",
    "[aout]",
    outPath,
  ]);
}

export interface MontageScene {
  imagePath: string;
  narrationPath: string;
  durationSec: number;
  transition: SceneTransition;
}

export interface BuildVideoParams {
  scenes: MontageScene[];
  assContent: string;
  outVideoPath: string;
  outThumbnailPath: string;
  style: VideoStyle;
}

/**
 * Assembles the final 1080x1920 H.264/30fps MP4: per-scene Ken Burns clips,
 * concatenated narration audio, a synthesized background bed mixed under it,
 * and the ASS subtitles burned in via ffmpeg's libass-backed filter.
 */
export async function buildVideo(params: BuildVideoParams): Promise<void> {
  const { scenes, assContent, outVideoPath, outThumbnailPath, style } = params;
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "faitstory-"));

  try {
    const clipPaths: string[] = [];
    for (let i = 0; i < scenes.length; i += 1) {
      const scene = scenes[i];
      const clipPath = path.join(workDir, `clip_${i}.mp4`);
      await buildSceneClip({
        imagePath: scene.imagePath,
        outPath: clipPath,
        durationSec: scene.durationSec,
        transition: scene.transition,
      });
      clipPaths.push(clipPath);
    }

    const videoListFile = path.join(workDir, "video_list.txt");
    const silentVideoPath = path.join(workDir, "silent.mp4");
    await concatFiles(clipPaths, videoListFile, silentVideoPath);

    const audioListFile = path.join(workDir, "audio_list.txt");
    const narrationPath = path.join(workDir, "narration.wav");
    await concatFiles(
      scenes.map((s) => s.narrationPath),
      audioListFile,
      narrationPath
    );

    const totalDurationSec = scenes.reduce((sum, s) => sum + s.durationSec, 0);
    const musicPath = path.join(workDir, "music.wav");
    await buildMusicBed(musicPath, totalDurationSec, style);

    const assPath = path.join(workDir, "subtitles.ass");
    await fs.writeFile(assPath, assContent, "utf8");

    await runFfmpeg([
      "-i",
      silentVideoPath,
      "-i",
      narrationPath,
      "-i",
      musicPath,
      "-filter_complex",
      [
        `[0:v]subtitles='${escapeFilterPath(assPath)}'[vout]`,
        `[1:a]volume=1.0[voice]`,
        `[2:a]volume=0.12[bg]`,
        `[voice][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]`,
      ].join(";"),
      "-map",
      "[vout]",
      "-map",
      "[aout]",
      "-r",
      String(FPS),
      "-pix_fmt",
      "yuv420p",
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-shortest",
      outVideoPath,
    ]);

    await runFfmpeg([
      "-i",
      scenes[0].imagePath,
      "-vf",
      `scale=${WIDTH / 2}:${HEIGHT / 2}`,
      "-frames:v",
      "1",
      outThumbnailPath,
    ]);
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
