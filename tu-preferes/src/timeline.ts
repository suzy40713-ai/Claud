import {
  FPS,
  HOOK_DURATION,
  MID_CTA_AFTER,
  OUTRO_DURATION,
  Q_COUNTDOWN,
  Q_ENTER,
  Q_REVEAL,
} from "./config";
import type { Episode } from "./questions";
import manifest from "./voice-manifest.json";

// Délai entre le début d'une scène et le début de la voix
export const VOICE_DELAY = 4;
// Temps laissé au spectateur pour choisir après la fin de la voix
const THINK_AFTER_VOICE = 36; // 1,2 s

export type QuestionTiming = {
  start: number;
  countdown: number;
  reveal: number;
  duration: number;
};

export type Timeline = {
  hook: number;
  questions: QuestionTiming[];
  outroStart: number;
  outro: number;
  total: number;
  voice: Record<string, number> | null;
};

const frames = (seconds: number | undefined) =>
  seconds === undefined ? 0 : Math.ceil(seconds * FPS);

// Les durées s'adaptent à la voix off (si elle a été générée),
// avec les valeurs de config.ts comme minimum.
export const buildTimeline = (episode: Episode): Timeline => {
  const voice =
    (manifest as Record<string, Record<string, number>>)[episode.id] ?? null;
  const v = (key: string) => frames(voice?.[key]);

  const hook = Math.max(HOOK_DURATION, v("hook") + VOICE_DELAY + 4);
  let cursor = hook;
  const questions = episode.questions.map((_, i) => {
    const countdown = Math.max(
      Q_COUNTDOWN,
      v(`q${i}`) + VOICE_DELAY - Q_ENTER + THINK_AFTER_VOICE,
    );
    const revealVoice = i === MID_CTA_AFTER ? v("cta") : v(`r${i}`);
    const reveal = Math.max(Q_REVEAL, revealVoice + VOICE_DELAY + 12);
    const timing = {
      start: cursor,
      countdown,
      reveal,
      duration: Q_ENTER + countdown + reveal,
    };
    cursor += timing.duration;
    return timing;
  });
  const outro = Math.max(OUTRO_DURATION, v("outro") + VOICE_DELAY + 20);

  return {
    hook,
    questions,
    outroStart: cursor,
    outro,
    total: cursor + outro,
    voice,
  };
};
