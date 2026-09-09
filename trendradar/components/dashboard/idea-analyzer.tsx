"use client";

import { useState } from "react";
import { ScoreRing } from "@/components/dashboard/score-ring";

interface Analysis {
  overall_score: number;
  curiosity_score: number;
  clarity_score: number;
  originality_score: number;
  retention_score: number;
  share_score: number;
  strengths: string[];
  improvements: string[];
  improved_versions: { title: string; hook: string; concept: string }[];
}

const CRITERIA: { key: keyof Analysis; label: string }[] = [
  { key: "curiosity_score", label: "Curiosité" },
  { key: "clarity_score", label: "Clarté" },
  { key: "originality_score", label: "Originalité" },
  { key: "retention_score", label: "Rétention" },
  { key: "share_score", label: "Partage" },
];

export function IdeaAnalyzer() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 10) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/analyze-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Analyse d'une idée</h1>
      <p className="mt-1 text-white/60">
        Décris ton idée telle qu'elle te vient, l'IA te dit ce qui fonctionne et ce qui peut être
        amélioré.
      </p>

      <form onSubmit={handleSubmit} className="glass-card mt-6 space-y-4 rounded-2xl p-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Ex: Je veux faire une vidéo sur les meilleurs buteurs de Ligue 1."
          className="w-full rounded-lg border border-border bg-surface2 px-4 py-3 text-white outline-none ring-accent/50 transition focus:ring-2"
        />
        <button
          type="submit"
          disabled={loading || text.trim().length < 10}
          className="rounded-lg bg-accent-gradient px-6 py-3 text-sm font-semibold shadow-lg shadow-accent/20 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Analyse en cours..." : "Analyser mon idée"}
        </button>
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </form>

      {analysis && (
        <div className="mt-8 space-y-6">
          <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-6 sm:flex-row sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/40">
                Score global
              </p>
              <p className="text-4xl font-extrabold text-accent-light">
                {analysis.overall_score}/100
              </p>
              <p className="mt-1 max-w-sm text-xs text-white/40">
                Score IA basé sur les caractéristiques du concept. Ce score n'est pas une garantie
                de performance.
              </p>
            </div>
            <div className="flex gap-4">
              {CRITERIA.map((c) => (
                <div key={c.key} className="flex flex-col items-center gap-1">
                  <ScoreRing score={analysis[c.key] as number} size={48} />
                  <span className="text-[11px] text-white/50">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="mb-3 font-semibold text-emerald-400">✓ Ce qui fonctionne</h3>
              <ul className="space-y-2 text-sm text-white/70">
                {analysis.strengths?.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
            <div className="glass-card rounded-2xl p-6">
              <h3 className="mb-3 font-semibold text-amber-400">↗ Ce qui peut être amélioré</h3>
              <ul className="space-y-2 text-sm text-white/70">
                {analysis.improvements?.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold">3 versions améliorées</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {analysis.improved_versions?.map((v, i) => (
                <div key={i} className="glass-card rounded-2xl p-5">
                  <p className="mb-2 text-xs font-medium text-white/40">Version {i + 1}</p>
                  <p className="mb-2 font-semibold">{v.title}</p>
                  <p className="mb-2 text-sm italic text-white/60">« {v.hook} »</p>
                  <p className="text-sm text-white/70">{v.concept}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
