/**
 * Rendu d'une vidéo VidaIA dans le navigateur : dessin image par image sur un canvas 1080×1920,
 * puis enregistrement (MediaRecorder) avec la voix off. Aucun calcul côté serveur.
 */
import type { Theme, VideoScript } from "@/lib/script";

export const W = 1080;
export const H = 1920;
const FONT = `"Geist", "Inter", "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Noto Color Emoji", sans-serif`;

export const THEME_COLORS: Record<Theme, { bg1: string; bg2: string; accent: string; accent2: string; soft: string }> = {
  bleu: { bg1: "#1d2a6b", bg2: "#070b1a", accent: "#3563E9", accent2: "#6d8dff", soft: "#c7d2fe" },
  violet: { bg1: "#4c1d95", bg2: "#0f0720", accent: "#7c3aed", accent2: "#c084fc", soft: "#e9d5ff" },
  vert: { bg1: "#065f46", bg2: "#03140f", accent: "#10b981", accent2: "#6ee7b7", soft: "#d1fae5" },
  orange: { bg1: "#9a3412", bg2: "#1a0802", accent: "#f97316", accent2: "#fdba74", soft: "#ffedd5" },
};

export type Timeline = { starts: number[]; voiceEnd: number; duration: number };

const ease = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Texte centré sur plusieurs lignes ; réduit la taille jusqu'à tenir dans maxLines. */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  o: { x: number; y: number; size: number; weight: number; color: string; maxWidth: number; maxLines: number; lineHeight?: number; align?: CanvasTextAlign },
) {
  let size = o.size;
  let lines: string[] = [];
  for (; size >= 28; size -= 4) {
    ctx.font = `${o.weight} ${size}px ${FONT}`;
    lines = wrap(ctx, text, o.maxWidth);
    if (lines.length <= o.maxLines) break;
  }
  ctx.fillStyle = o.color;
  ctx.textAlign = o.align ?? "center";
  ctx.textBaseline = "middle";
  const lh = size * (o.lineHeight ?? 1.15);
  const top = o.y - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, o.x, top + i * lh));
  return { height: lines.length * lh, size };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Scène active à l'instant t : 0 = accroche, 1-3 = points, 4 = conclusion. */
export function sceneAt(t: number, starts: number[]) {
  let s = 0;
  for (let i = 0; i < starts.length; i++) if (t >= starts[i]) s = i;
  return s;
}

export function drawFrame(ctx: CanvasRenderingContext2D, script: VideoScript, tl: Timeline, theme: Theme, t: number) {
  const c = THEME_COLORS[theme];
  // Fond : dégradé radial qui respire doucement.
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.6);
  const g = ctx.createRadialGradient(W / 2, H * (0.35 + 0.03 * pulse), 50, W / 2, H * 0.4, H * 0.75);
  g.addColorStop(0, c.bg1);
  g.addColorStop(1, c.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const scene = sceneAt(t, tl.starts);
  const local = t - tl.starts[scene];
  const end = scene < tl.starts.length - 1 ? tl.starts[scene + 1] : tl.duration;
  const fadeIn = ease(local / 0.35);
  const fadeOut = scene < tl.starts.length - 1 ? Math.min(1, (end - t) / 0.2) : 1;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(fadeIn, fadeOut));

  if (scene === 0) {
    const scale = 1.08 - 0.08 * ease(local / 0.6);
    ctx.translate(W / 2, H * 0.45);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H * 0.45);
    drawText(ctx, script.hook, { x: W / 2, y: H * 0.45, size: 112, weight: 900, color: "#ffffff", maxWidth: W - 140, maxLines: 5 });
  } else if (scene <= 3) {
    const p = script.points[scene - 1];
    const slide = (1 - ease(local / 0.45)) * 90;
    ctx.translate(0, slide);
    // Pastille numéro.
    const bx = 110;
    const by = 560;
    const grad = ctx.createLinearGradient(bx, by, bx + 200, by + 200);
    grad.addColorStop(0, c.accent);
    grad.addColorStop(1, c.accent2);
    ctx.fillStyle = grad;
    roundRect(ctx, bx, by, 200, 200, 52);
    ctx.fill();
    ctx.font = `900 140px ${FONT}`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(scene), bx + 100, by + 108);
    const title = drawText(ctx, p.title, { x: 110, y: 960, size: 104, weight: 900, color: "#ffffff", maxWidth: W - 220, maxLines: 3, align: "left" });
    const dAlpha = ease((local - 0.35) / 0.4);
    ctx.globalAlpha *= dAlpha;
    drawText(ctx, p.detail, { x: 110, y: 960 + title.height / 2 + 140, size: 64, weight: 700, color: c.soft, maxWidth: W - 220, maxLines: 4, align: "left", lineHeight: 1.25 });
  } else {
    const scale = 1.06 - 0.06 * ease(local / 0.6);
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);
    drawText(ctx, script.closing, { x: W / 2, y: H * 0.4, size: 96, weight: 900, color: "#ffffff", maxWidth: W - 160, maxLines: 4 });
    // Bouton d'appel à l'action, qui rebondit.
    const bounce = 1 + 0.04 * Math.sin(local * 5);
    ctx.font = `900 72px ${FONT}`;
    const tw = Math.min(ctx.measureText(script.cta).width, W - 260);
    const bw = tw + 120;
    const bh = 150;
    ctx.save();
    ctx.translate(W / 2, H * 0.6);
    ctx.scale(bounce, bounce);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 40);
    ctx.fill();
    ctx.fillStyle = c.accent;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(script.cta, 0, 6, W - 260);
    ctx.restore();
  }
  ctx.restore();

  // Barre de progression discrète en bas.
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(0, H - 14, W, 14);
  ctx.fillStyle = c.accent2;
  ctx.fillRect(0, H - 14, W * Math.min(1, t / tl.duration), 14);
}

export function base64ToArrayBuffer(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

/** Format d'enregistrement : MP4 si le navigateur sait le faire, sinon WebM. */
export function pickMimeType() {
  const candidates = [
    // MP4 seulement en H.264 + AAC (accepté partout) ; sinon WebM, sous son vrai nom.
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1.640028,mp4a.40.2",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) ?? "";
}

/**
 * Joue la vidéo sur le canvas avec le son ; si record = true, renvoie le fichier enregistré.
 * onProgress reçoit la progression (0 à 1).
 */
export async function play(opts: {
  canvas: HTMLCanvasElement;
  script: VideoScript;
  timeline: Timeline;
  theme: Theme;
  audioBase64: string;
  record: boolean;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
}): Promise<{ blob: Blob; mimeType: string } | null> {
  const ctx = opts.canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  const ac = new AudioContext();
  const buffer = await ac.decodeAudioData(base64ToArrayBuffer(opts.audioBase64));
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.connect(ac.destination);

  let recorder: MediaRecorder | null = null;
  const chunks: Blob[] = [];
  const mimeType = pickMimeType();
  if (opts.record) {
    if (!mimeType) throw new Error("Votre navigateur ne sait pas enregistrer de vidéo. Essayez Chrome ou Edge sur ordinateur.");
    const dest = ac.createMediaStreamDestination();
    src.connect(dest);
    const stream = new MediaStream([...opts.canvas.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 160_000 });
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.start(250);
  }

  drawFrame(ctx, opts.script, opts.timeline, opts.theme, 0);
  const t0 = ac.currentTime + 0.15;
  src.start(t0);

  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = Math.max(0, ac.currentTime - t0);
      drawFrame(ctx, opts.script, opts.timeline, opts.theme, Math.min(t, opts.timeline.duration));
      opts.onProgress?.(Math.min(1, t / opts.timeline.duration));
      if (t >= opts.timeline.duration || opts.signal?.aborted) return resolve();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  try {
    src.stop();
  } catch {
    /* déjà arrêté */
  }
  let result: { blob: Blob; mimeType: string } | null = null;
  if (recorder) {
    const stopped = new Promise<void>((r) => (recorder!.onstop = () => r()));
    recorder.stop();
    await stopped;
    if (!opts.signal?.aborted) result = { blob: new Blob(chunks, { type: mimeType.split(";")[0] }), mimeType };
  }
  await ac.close();
  return result;
}
