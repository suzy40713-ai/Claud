export interface TimedScene {
  narrationText: string;
  durationSec: number;
}

export interface SubtitleCue {
  startSec: number;
  endSec: number;
  text: string;
}

const MAX_CHARS_PER_LINE = 32;
const MAX_LINES = 2;

function pad(n: number, width: number): string {
  return String(Math.trunc(n)).padStart(width, "0");
}

/** Greedy word-wrap capped at MAX_LINES lines, matching the "gros texte, 2 lignes max" spec. */
function wrapLines(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > MAX_CHARS_PER_LINE && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, MAX_LINES).join("\n");
}

/** Turns each scene's narration + measured audio duration into subtitle cue timestamps. */
export function buildCues(scenes: TimedScene[]): SubtitleCue[] {
  let cursor = 0;
  return scenes.map((scene) => {
    const startSec = cursor;
    const endSec = cursor + scene.durationSec;
    cursor = endSec;
    return { startSec, endSec, text: scene.narrationText };
  });
}

function formatSrtTimestamp(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

export function buildSrt(cues: SubtitleCue[]): string {
  return cues
    .map(
      (cue, i) =>
        `${i + 1}\n${formatSrtTimestamp(cue.startSec)} --> ${formatSrtTimestamp(cue.endSec)}\n${wrapLines(cue.text)}\n`
    )
    .join("\n");
}

function formatAssTimestamp(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.round((sec - Math.floor(sec)) * 100);
  return `${h}:${pad(m, 2)}:${pad(s, 2)}.${pad(cs, 2)}`;
}

// 1080x1920 canvas, bold white text with a heavy black outline, positioned
// low-center (MarginV keeps it clear of TikTok's own UI overlay).
const ASS_HEADER = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DejaVu Sans,72,&H00FFFFFF,&H0000FFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,2,60,60,220,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

/** Same cues as buildSrt, formatted as ASS so ffmpeg's `subtitles=` filter (libass) can burn them in with real styling. */
export function buildAss(cues: SubtitleCue[]): string {
  const lines = cues.map((cue) => {
    const text = wrapLines(cue.text).replace(/\n/g, "\\N");
    return `Dialogue: 0,${formatAssTimestamp(cue.startSec)},${formatAssTimestamp(cue.endSec)},Default,,0,0,0,,${text}`;
  });
  return ASS_HEADER + lines.join("\n") + "\n";
}
