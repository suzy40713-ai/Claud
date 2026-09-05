import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prisma } from "@/lib/db";
import { VideoStatus } from "@/generated/prisma/enums";
import { researchSubject } from "./research";
import { generateScript } from "./script";
import { buildScenes, type SceneDraft } from "./scenes";
import { buildVisualPrompt, getImageProvider } from "./visualPrompts";
import { getVoiceProvider } from "./voice";
import { buildCues, buildAss, buildSrt } from "./subtitles";
import { buildVideo } from "./montage";

const PUBLIC_DIR = path.join(process.cwd(), "public", "generated");

export interface EnrichedScene {
  index: number;
  narrationText: string;
  onScreenText: string;
  transition: SceneDraft["transition"];
  durationSec: number;
  visualDescription: string;
}

async function setStatus(videoId: string, status: (typeof VideoStatus)[keyof typeof VideoStatus]) {
  await prisma.video.update({ where: { id: videoId }, data: { status } });
}

/**
 * Runs the full FAITSTORY AI pipeline for a video row already created in
 * PENDING state: research -> script -> scenes -> visuals -> voice ->
 * subtitles -> montage, updating `status` at each stage so the UI can poll
 * for progress. Cleans up its own temp working files on both success and
 * failure; on failure the video is marked FAILED with `errorMessage` set.
 */
export async function runPipeline(videoId: string): Promise<void> {
  const video = await prisma.video.findUniqueOrThrow({ where: { id: videoId } });
  const jobDir = await fs.mkdtemp(path.join(os.tmpdir(), `faitstory-job-${videoId}-`));
  const outDir = path.join(PUBLIC_DIR, videoId);

  try {
    await fs.mkdir(outDir, { recursive: true });

    await setStatus(videoId, VideoStatus.RESEARCHING);
    const research = await researchSubject(video.subject);

    await setStatus(videoId, VideoStatus.WRITING_SCRIPT);
    const script = generateScript({
      subject: video.subject,
      style: video.style,
      suspenseLevel: video.suspenseLevel,
      durationSec: video.durationSec,
      research,
    });
    await prisma.video.update({
      where: { id: videoId },
      data: {
        title: script.title,
        hook: script.sections.hook,
        script: script as unknown as object,
        hashtags: script.hashtags,
        sources: research.sources as unknown as object,
      },
    });

    await setStatus(videoId, VideoStatus.BUILDING_SCENES);
    const sceneDrafts = buildScenes(script);
    const imageProvider = getImageProvider();

    const scenesWithImages: (SceneDraft & { imagePath: string; visualPrompt: string })[] = [];
    for (const scene of sceneDrafts) {
      const visual = buildVisualPrompt(scene, video.style);
      const imagePath = path.join(jobDir, `scene_${scene.index}.jpg`);
      const imageBuffer = await imageProvider.fetchImage(visual.prompt, {
        width: 1080,
        height: 1920,
        seed: Math.floor(Math.random() * 1_000_000) + scene.index,
      });
      await fs.writeFile(imagePath, imageBuffer);
      scenesWithImages.push({ ...scene, imagePath, visualPrompt: visual.prompt });
    }

    await setStatus(videoId, VideoStatus.GENERATING_VOICE);
    const voiceProvider = getVoiceProvider();
    const scenesWithVoice: (SceneDraft & { imagePath: string; visualPrompt: string; narrationPath: string; durationSec: number })[] =
      [];
    for (const scene of scenesWithImages) {
      const narrationPath = path.join(jobDir, `scene_${scene.index}.wav`);
      const { durationSec } = await voiceProvider.synthesize(scene.narrationText, {
        gender: video.voiceGender,
        outPath: narrationPath,
      });
      scenesWithVoice.push({ ...scene, narrationPath, durationSec });
    }

    await setStatus(videoId, VideoStatus.GENERATING_SUBTITLES);
    const cues = buildCues(scenesWithVoice.map((s) => ({ narrationText: s.narrationText, durationSec: s.durationSec })));
    const ass = buildAss(cues);
    const srt = buildSrt(cues);
    const srtPath = path.join(outDir, "subtitles.srt");
    await fs.writeFile(srtPath, srt, "utf8");

    await setStatus(videoId, VideoStatus.RENDERING);
    const videoFileName = "video.mp4";
    const thumbnailFileName = "thumb.jpg";
    await buildVideo({
      scenes: scenesWithVoice.map((s) => ({
        imagePath: s.imagePath,
        narrationPath: s.narrationPath,
        durationSec: s.durationSec,
        transition: s.transition,
      })),
      assContent: ass,
      outVideoPath: path.join(outDir, videoFileName),
      outThumbnailPath: path.join(outDir, thumbnailFileName),
      style: video.style,
    });

    const enrichedScenes: EnrichedScene[] = scenesWithVoice.map((s) => ({
      index: s.index,
      narrationText: s.narrationText,
      onScreenText: s.onScreenText,
      transition: s.transition,
      durationSec: s.durationSec,
      visualDescription: s.visualPrompt,
    }));

    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: VideoStatus.DONE,
        scenes: enrichedScenes as unknown as object,
        videoPath: `/generated/${videoId}/${videoFileName}`,
        thumbnailPath: `/generated/${videoId}/${thumbnailFileName}`,
        srtPath: `/generated/${videoId}/subtitles.srt`,
      },
    });
  } catch (err) {
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: VideoStatus.FAILED,
        errorMessage: err instanceof Error ? err.message : "Erreur inconnue pendant la generation.",
      },
    });
    throw err;
  } finally {
    await fs.rm(jobDir, { recursive: true, force: true }).catch(() => {});
  }
}
