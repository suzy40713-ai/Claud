import type { GeneratedScript } from "./script";

export type SceneKind = "hook" | "intro" | "developpement" | "suspense" | "conclusion";
export type SceneTransition = "zoom-in" | "zoom-out";

export interface SceneDraft {
  index: number;
  kind: SceneKind;
  narrationText: string;
  onScreenText: string;
  transition: SceneTransition;
  // Rough estimate (word count based) used for progress display before the
  // real narration audio is generated; voice.ts overwrites it with the
  // measured duration of the synthesized clip.
  estimatedDurationSec: number;
}

const WORDS_PER_SECOND = 2.3;
const MIN_SCENES = 6;
const MAX_SCENES = 10;
const ON_SCREEN_MAX_WORDS = 7;

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateDuration(text: string): number {
  return Math.max(countWords(text) / WORDS_PER_SECOND, 1.5);
}

function onScreenTextFor(text: string): string {
  const words = text.replace(/["""]/g, "").split(/\s+/).filter(Boolean);
  if (words.length <= ON_SCREEN_MAX_WORDS) return text.replace(/\.$/, "");
  return `${words.slice(0, ON_SCREEN_MAX_WORDS).join(" ")}…`;
}

interface Segment {
  text: string;
  kind: SceneKind;
}

function mergeDeveloppementSegments(segments: Segment[], max: number): Segment[] {
  const result = [...segments];
  while (result.length > max) {
    let bestIndex = -1;
    let bestScore = Infinity;
    for (let i = 0; i < result.length - 1; i += 1) {
      if (result[i].kind !== "developpement" || result[i + 1].kind !== "developpement") continue;
      const score = countWords(result[i].text) + countWords(result[i + 1].text);
      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    if (bestIndex === -1) break; // nothing mergeable left without touching hook/intro/suspense/conclusion
    result.splice(bestIndex, 2, {
      text: `${result[bestIndex].text} ${result[bestIndex + 1]?.text ?? ""}`.trim(),
      kind: "developpement",
    });
  }
  return result;
}

function splitLongestSegment(segments: Segment[], min: number): Segment[] {
  const result = [...segments];
  let guard = 20; // avoid infinite loops on pathological input
  while (result.length < min && guard > 0) {
    guard -= 1;
    let bestIndex = -1;
    let bestWordCount = 0;
    for (let i = 0; i < result.length; i += 1) {
      const parts = result[i].text.split(/,\s+/);
      if (parts.length < 2) continue;
      const w = countWords(result[i].text);
      if (w > bestWordCount) {
        bestWordCount = w;
        bestIndex = i;
      }
    }
    if (bestIndex === -1) break; // nothing left worth splitting
    const parts = result[bestIndex].text.split(/,\s+/);
    const mid = Math.ceil(parts.length / 2);
    const first = `${parts.slice(0, mid).join(", ")}.`;
    const second = `${parts.slice(mid).join(", ")}.`;
    result.splice(bestIndex, 1, { text: first, kind: result[bestIndex].kind }, { text: second, kind: result[bestIndex].kind });
  }
  return result;
}

/**
 * Splits the generated script into 6-10 scenes: the hook and conclusion are
 * always their own scene, the developpement is split one sentence per scene
 * (merged down or split further as needed to land in the 6-10 range).
 */
export function buildScenes(script: GeneratedScript): SceneDraft[] {
  let segments: Segment[] = [
    { text: script.sections.hook, kind: "hook" },
    ...splitIntoSentences(script.sections.intro).map((text) => ({ text, kind: "intro" as const })),
    ...splitIntoSentences(script.sections.developpement).map((text) => ({ text, kind: "developpement" as const })),
    { text: script.sections.suspense, kind: "suspense" },
    { text: script.sections.conclusion, kind: "conclusion" },
  ];

  segments = mergeDeveloppementSegments(segments, MAX_SCENES);
  segments = splitLongestSegment(segments, MIN_SCENES);

  return segments.map((segment, index) => ({
    index,
    kind: segment.kind,
    narrationText: segment.text,
    onScreenText: onScreenTextFor(segment.text),
    transition: index % 2 === 0 ? "zoom-in" : "zoom-out",
    estimatedDurationSec: estimateDuration(segment.text),
  }));
}
