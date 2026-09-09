"use client";

import { useState } from "react";
import { IdeaCard } from "@/components/dashboard/idea-card";
import type { ContentStyle, Idea, Platform } from "@/lib/supabase/types";

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube_shorts", label: "YouTube Shorts" },
];

const STYLES: { value: ContentStyle; label: string }[] = [
  { value: "educational", label: "Éducatif" },
  { value: "storytelling", label: "Storytelling" },
  { value: "ranking", label: "Classement" },
  { value: "debate", label: "Débat" },
  { value: "humor", label: "Humour" },
  { value: "news", label: "Actualité" },
  { value: "tutorial", label: "Tutoriel" },
];

export function IdeaGenerator({
  canGenerateScript,
  canGenerateVariants,
  userName,
}: {
  canGenerateScript: boolean;
  canGenerateVariants: boolean;
  userName: string;
}) {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [style, setStyle] = useState<ContentStyle>("storytelling");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!niche.trim()) return;
    setLoading(true);
    setError(null);
    setIdeas([]);

    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, platform, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
      setIdeas(data.ideas);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  function handleSaveToggle(idea: Idea, saved: boolean) {
    setIdeas((prev) => prev.map((i) => (i.id === idea.id ? { ...i, is_saved: saved } : i)));
  }

  function handleVariants(variants: Idea[]) {
    setIdeas((prev) => [...prev, ...variants]);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Bonjour {userName} 👋</h1>
      <p className="mt-1 text-white/60">Que veux-tu créer aujourd'hui ?</p>

      <form onSubmit={handleSubmit} className="glass-card mt-6 space-y-4 rounded-2xl p-6">
        <div>
          <label className="mb-1.5 block text-sm text-white/70">Ta niche</label>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Entre ta niche... (ex: Football)"
            className="w-full rounded-lg border border-border bg-surface2 px-4 py-3 text-white outline-none ring-accent/50 transition focus:ring-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-white/70">Plateforme</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    platform === p.value
                      ? "border-accent bg-accent/20 text-accent-light"
                      : "border-white/15 text-white/70 hover:bg-white/5"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-white/70">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    style === s.value
                      ? "border-accent bg-accent/20 text-accent-light"
                      : "border-white/15 text-white/70 hover:bg-white/5"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !niche.trim()}
          className="rounded-lg bg-accent-gradient px-6 py-3 text-sm font-semibold shadow-lg shadow-accent/20 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Recherche en cours..." : "🔎 Trouver des idées"}
        </button>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </form>

      {ideas.length > 0 && (
        <div className="mt-8">
          <p className="mb-4 text-xs text-white/40">
            Score IA basé sur les caractéristiques du concept. Ce score n'est pas une garantie de
            performance.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                platform={platform}
                canGenerateScript={canGenerateScript}
                canGenerateVariants={canGenerateVariants}
                onSaveToggle={handleSaveToggle}
                onVariants={handleVariants}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
