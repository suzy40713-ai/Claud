import { spawn } from "node:child_process";
import type { VoiceGender } from "@/generated/prisma/enums";

function runProcess(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (err) => {
      reject(new Error(`Impossible de lancer ${command} (est-il installe ?) : ${err.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} a echoue (code ${code}): ${stderr.slice(-1000)}`));
    });
  });
}

async function ffprobeDurationSec(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`ffprobe a echoue: ${stderr.slice(-500)}`));
      const duration = Number.parseFloat(stdout.trim());
      if (!Number.isFinite(duration)) return reject(new Error("Duree audio illisible"));
      resolve(duration);
    });
  });
}

export interface VoiceSynthesisResult {
  durationSec: number;
}

export interface VoiceProvider {
  synthesize(text: string, opts: { gender: VoiceGender; outPath: string }): Promise<VoiceSynthesisResult>;
}

const ESPEAK_VOICES: Record<VoiceGender, string> = {
  HOMME: "fr+m3",
  FEMME: "fr+f3",
};

/**
 * Free, offline, no-key TTS via the espeak-ng system binary. Quality is
 * robotic but the app works end to end with zero cost; swap TTS_PROVIDER to
 * plug in a paid provider (ElevenLabs, etc.) without touching the rest of
 * the pipeline.
 */
export const espeakVoiceProvider: VoiceProvider = {
  async synthesize(text, { gender, outPath }) {
    await runProcess("espeak-ng", ["-v", ESPEAK_VOICES[gender], "-s", "155", "-w", outPath, text]);
    const durationSec = await ffprobeDurationSec(outPath);
    return { durationSec };
  },
};

export function getVoiceProvider(): VoiceProvider {
  const provider = process.env.TTS_PROVIDER ?? "espeak";
  if (provider === "espeak") return espeakVoiceProvider;
  throw new Error(`Fournisseur TTS inconnu: ${provider}`);
}
