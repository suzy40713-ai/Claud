"use client";

import { useEffect, useRef, useState } from "react";
import { drawFrame, H, pickMimeType, play, W, type Timeline } from "@/components/renderer";
import type { Theme, VideoScript } from "@/lib/script";

export function Player(props: { script: VideoScript; theme: Theme; timeline: Timeline; audioBase64: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "recording">("idle");
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<{ url: string; ext: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) drawFrame(ctx, props.script, props.timeline, props.theme, 0.6);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(pickMimeType() !== "");
  }, [props.script, props.timeline, props.theme]);

  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url); }, [file]);

  async function run(record: boolean) {
    if (!canvas.current) return;
    setError(null);
    setState(record ? "recording" : "playing");
    try {
      const r = await play({ ...props, canvas: canvas.current, record, onProgress: setProgress });
      if (r) setFile({ url: URL.createObjectURL(r.blob), ext: r.mimeType.includes("mp4") ? "mp4" : "webm" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "La vidéo n'a pas pu être créée.");
    } finally {
      setState("idle");
      setProgress(0);
    }
  }

  return (
    <div className="mt-6 grid items-start gap-6 sm:grid-cols-[300px_1fr]">
      <canvas
        ref={canvas}
        width={W}
        height={H}
        className="aspect-[9/16] w-full max-w-[300px] rounded-[1.5rem] border-4 border-[#241a3d]"
        data-testid="video-canvas"
      />
      <div className="grid gap-3">
        <button className="btn btn-ghost" disabled={state !== "idle"} onClick={() => run(false)}>
          {state === "playing" ? "Lecture…" : "▶ Regarder"}
        </button>
        <button className="btn" disabled={state !== "idle" || !supported} onClick={() => run(true)} data-testid="make-file">
          {state === "recording" ? `Fabrication de la vidéo… ${Math.round(progress * 100)} %` : "Créer le fichier vidéo"}
        </button>
        {state === "recording" ? (
          <p className="text-sm text-amber-200">Garde cet onglet ouvert et visible jusqu&apos;à la fin (≈ {Math.ceil(props.timeline.duration)} s).</p>
        ) : null}
        {!supported ? (
          <p className="text-sm text-amber-200">Ce navigateur ne sait pas enregistrer de vidéo. Ouvre ton studio avec Chrome ou Edge sur ordinateur.</p>
        ) : null}
        {file ? (
          <a className="btn" href={file.url} download={`vidaia-${Date.now()}.${file.ext}`} data-testid="download">
            ⬇ Télécharger ({file.ext.toUpperCase()})
          </a>
        ) : null}
        {error ? <p className="rounded-xl bg-red-500/15 p-3 text-red-200" role="alert">{error}</p> : null}
        <p className="text-xs muted">Tu peux refabriquer et retélécharger cette vidéo autant de fois que tu veux, sans crédit.</p>
      </div>
    </div>
  );
}
