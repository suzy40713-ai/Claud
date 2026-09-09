"use client";

import { useState } from "react";
import type { Platform, RadarSignal } from "@/lib/supabase/types";

const CATEGORIES: { key: RadarSignal["category"]; label: string; icon: string }[] = [
  { key: "trending", label: "Trending", icon: "🔥" },
  { key: "rising", label: "En progression", icon: "📈" },
  { key: "watch", label: "À surveiller", icon: "👀" },
  { key: "opportunity", label: "Opportunités", icon: "💡" },
];

export function RadarBoard() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [signals, setSignals] = useState<RadarSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!niche.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/radar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setSignals(data.signals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Radar</h1>
      <p className="mt-1 text-white/60">Repère les angles à exploiter dans ta niche.</p>

      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        ⚠️ Ces signaux sont des estimations qualitatives générées par IA, pas des données de
        tendances en temps réel. L'architecture est prête pour connecter Google Trends et des
        APIs sociales dès qu'elles seront disponibles.
      </div>

      <form onSubmit={handleSubmit} className="glass-card mt-6 flex flex-wrap gap-3 rounded-2xl p-6">
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="Niche (ex: Football)"
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-surface2 px-4 py-2.5 text-white outline-none ring-accent/50 transition focus:ring-2"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform | "all")}
          className="rounded-lg border border-border bg-surface2 px-4 py-2.5 text-white outline-none ring-accent/50 transition focus:ring-2"
        >
          <option value="all">Toutes plateformes</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="youtube_shorts">YouTube Shorts</option>
        </select>
        <button
          type="submit"
          disabled={loading || !niche.trim()}
          className="rounded-lg bg-accent-gradient px-6 py-2.5 text-sm font-semibold shadow-lg shadow-accent/20 transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Scan..." : "Scanner le radar"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {signals.length > 0 && (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <div key={cat.key} className="glass-card rounded-2xl p-5">
              <h3 className="mb-4 flex items-center gap-2 font-semibold">
                <span>{cat.icon}</span> {cat.label}
              </h3>
              <div className="space-y-4">
                {signals
                  .filter((s) => s.category === cat.key)
                  .map((s) => (
                    <div key={s.id} className="rounded-xl border border-white/10 bg-surface2 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-sm font-medium">{s.title}</p>
                        <span className="text-xs text-white/40">{s.confidence}%</span>
                      </div>
                      <p className="text-xs text-white/60">{s.description}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
