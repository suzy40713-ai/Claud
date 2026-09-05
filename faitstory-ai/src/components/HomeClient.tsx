"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { VideoStyle, VoiceGender, SuspenseLevel } from "@/generated/prisma/enums";
import { STYLE_LABELS, SUSPENSE_LABELS, VOICE_LABELS, type ApiVideo } from "@/lib/types";
import { ProgressStepper } from "./ProgressStepper";
import { ResultPanel } from "./ResultPanel";

const DURATIONS = [30, 45, 60] as const;
const STYLES: VideoStyle[] = ["SURVIE", "SCIENCE", "ASTUCE", "INSOLITE"];
const VOICES: VoiceGender[] = ["HOMME", "FEMME"];
const SUSPENSE_LEVELS: SuspenseLevel[] = ["FAIBLE", "MOYEN", "FORT"];

const AUTO_DEFAULTS = {
  durationSec: 45 as const,
  style: "INSOLITE" as VideoStyle,
  voiceGender: "FEMME" as VoiceGender,
  suspenseLevel: "MOYEN" as SuspenseLevel,
};

export function HomeClient() {
  const [subject, setSubject] = useState("");
  const [durationSec, setDurationSec] = useState<30 | 45 | 60>(45);
  const [style, setStyle] = useState<VideoStyle>("INSOLITE");
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("FEMME");
  const [suspenseLevel, setSuspenseLevel] = useState<SuspenseLevel>("MOYEN");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<ApiVideo | null>(null);

  async function submit(auto: boolean) {
    setError(null);
    if (subject.trim().length < 5) {
      setError("Decris le sujet en au moins quelques mots.");
      return;
    }
    setSubmitting(true);
    setVideo(null);
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          durationSec: auto ? AUTO_DEFAULTS.durationSec : durationSec,
          style: auto ? AUTO_DEFAULTS.style : style,
          voiceGender: auto ? AUTO_DEFAULTS.voiceGender : voiceGender,
          suspenseLevel: auto ? AUTO_DEFAULTS.suspenseLevel : suspenseLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur inconnue.");

      const videoRes = await fetch(`/api/videos/${data.id}`);
      const videoData = await videoRes.json();
      setVideo(videoData.video as ApiVideo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!video || video.status === "DONE" || video.status === "FAILED") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/videos/${video.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setVideo(data.video as ApiVideo);
    }, 2000);
    return () => clearInterval(interval);
  }, [video]);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold">Quel fait veux-tu raconter ?</h1>
        <p className="mt-2 text-muted">
          Decris un fait, une astuce ou un sujet insolite. FAITSTORY AI ecrit le script, illustre les
          scenes, ajoute la voix, les sous-titres et monte la video au format TikTok.
        </p>
      </div>

      <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
        <textarea
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          rows={3}
          placeholder="Ex: que faire si on se fait piquer par un serpent"
          className="w-full resize-none rounded-lg border border-border bg-background p-3 outline-none focus:border-accent"
        />

        <Field label="Duree">
          <ButtonGroup options={DURATIONS.map((d) => ({ value: d, label: `${d}s` }))} value={durationSec} onChange={setDurationSec} />
        </Field>

        <Field label="Style">
          <ButtonGroup
            options={STYLES.map((s) => ({ value: s, label: `${STYLE_LABELS[s].emoji} ${STYLE_LABELS[s].label}` }))}
            value={style}
            onChange={setStyle}
          />
        </Field>

        <Field label="Voix">
          <ButtonGroup options={VOICES.map((v) => ({ value: v, label: VOICE_LABELS[v] }))} value={voiceGender} onChange={setVoiceGender} />
        </Field>

        <Field label="Niveau de suspense">
          <ButtonGroup
            options={SUSPENSE_LEVELS.map((s) => ({ value: s, label: SUSPENSE_LABELS[s] }))}
            value={suspenseLevel}
            onChange={setSuspenseLevel}
          />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => submit(false)}
            disabled={submitting}
            className="rounded-lg bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            🎬 Generer ma video
          </button>
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={submitting}
            className="rounded-lg border border-accent px-5 py-3 font-semibold text-accent hover:bg-accent-soft disabled:opacity-50"
          >
            ⚡ Generation automatique
          </button>
        </div>
      </div>

      {video && (
        <div className="space-y-5 rounded-2xl border border-border bg-surface p-6">
          <ProgressStepper status={video.status} />
          {(video.status === "DONE" || video.status === "FAILED") && <ResultPanel video={video} />}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm text-muted">{label}</p>
      {children}
    </div>
  );
}

function ButtonGroup<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
            option.value === value ? "border-accent bg-accent-soft text-foreground" : "border-border text-muted hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
