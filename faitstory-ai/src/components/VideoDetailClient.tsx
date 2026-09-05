"use client";

import { useEffect, useState } from "react";
import type { ApiVideo } from "@/lib/types";
import { STYLE_LABELS, SUSPENSE_LABELS, VOICE_LABELS } from "@/lib/types";
import { ProgressStepper } from "./ProgressStepper";
import { ResultPanel } from "./ResultPanel";

export function VideoDetailClient({ initialVideo }: { initialVideo: ApiVideo }) {
  const [video, setVideo] = useState(initialVideo);
  const [titleDraft, setTitleDraft] = useState(initialVideo.title ?? initialVideo.subject);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (video.status === "DONE" || video.status === "FAILED") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/videos/${video.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setVideo(data.video as ApiVideo);
    }, 2000);
    return () => clearInterval(interval);
  }, [video.id, video.status]);

  async function saveTitle() {
    if (!titleDraft.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleDraft.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setVideo(data.video as ApiVideo);
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="flex items-center gap-3">
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xl font-bold outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={saveTitle}
          disabled={saving}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>

      <p className="text-sm text-muted">Sujet : {video.subject}</p>

      <div className="flex flex-wrap gap-2 text-xs text-muted">
        <span>
          {STYLE_LABELS[video.style].emoji} {STYLE_LABELS[video.style].label}
        </span>
        <span>· {VOICE_LABELS[video.voiceGender]}</span>
        <span>· Suspense {SUSPENSE_LABELS[video.suspenseLevel]}</span>
        <span>· {video.durationSec}s</span>
      </div>

      {video.status !== "DONE" && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <ProgressStepper status={video.status} />
        </div>
      )}

      <ResultPanel video={video} />

      {video.script && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-6 text-sm">
          <h2 className="font-semibold">Script</h2>
          <ScriptSection label="Hook" text={video.script.sections.hook} />
          <ScriptSection label="Intro" text={video.script.sections.intro} />
          <ScriptSection label="Developpement" text={video.script.sections.developpement} />
          <ScriptSection label="Suspense" text={video.script.sections.suspense} />
          <ScriptSection label="Conclusion" text={video.script.sections.conclusion} />
        </div>
      )}

      {video.scenes && video.scenes.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-6 text-sm">
          <h2 className="font-semibold">Scenes ({video.scenes.length})</h2>
          <ol className="space-y-3">
            {video.scenes.map((scene) => (
              <li key={scene.index} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted">
                  Scene {scene.index + 1} · {scene.durationSec.toFixed(1)}s · {scene.transition}
                </p>
                <p className="mt-1">{scene.narrationText}</p>
                <p className="mt-1 text-xs text-muted">Texte a l&apos;ecran : « {scene.onScreenText} »</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function ScriptSection({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p>{text}</p>
    </div>
  );
}
