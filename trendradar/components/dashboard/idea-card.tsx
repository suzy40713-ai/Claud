"use client";

import { useState } from "react";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { ScriptPanel } from "@/components/dashboard/script-panel";
import type { Idea, Platform } from "@/lib/supabase/types";

export function IdeaCard({
  idea,
  platform,
  canGenerateScript,
  canGenerateVariants,
  onSaveToggle,
  onVariants,
}: {
  idea: Idea;
  platform: Platform;
  canGenerateScript: boolean;
  canGenerateVariants: boolean;
  onSaveToggle: (idea: Idea, save: boolean) => void;
  onVariants: (variants: Idea[]) => void;
}) {
  const [showScript, setShowScript] = useState(false);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setSaveError(null);
    try {
      const res = await fetch("/api/toggle-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: idea.id, save: !idea.is_saved }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaveToggle(idea, !idea.is_saved);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur");
    }
  }

  async function handleVariants() {
    setVariantsLoading(true);
    try {
      const res = await fetch("/api/generate-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId: idea.id, platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onVariants(data.ideas);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setVariantsLoading(false);
    }
  }

  function handleCopy() {
    const text = `${idea.title}\n\nHook: ${idea.hook}\n\nConcept: ${idea.concept}\n\nCTA: ${idea.cta}\n\nHashtags: ${idea.hashtags.join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="glass-card flex flex-col rounded-2xl p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{idea.title}</h3>
        <ScoreRing score={idea.opportunity_score} />
      </div>

      <p className="mb-2 text-sm italic text-white/60">« {idea.hook} »</p>
      <p className="mb-3 flex-1 text-sm text-white/70">{idea.concept}</p>

      <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-white/50">
        {idea.format && <p>🎬 {idea.format}</p>}
        {idea.recommended_duration && <p>⏱ {idea.recommended_duration}</p>}
        {idea.audience && <p>🎯 {idea.audience}</p>}
      </div>

      {idea.cta && (
        <p className="mb-3 text-sm">
          <span className="text-white/40">CTA : </span>
          {idea.cta}
        </p>
      )}

      {idea.hashtags?.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {idea.hashtags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-accent-light">
              {tag}
            </span>
          ))}
        </div>
      )}

      {saveError && <p className="mb-2 text-xs text-red-400">{saveError}</p>}

      <div className="mt-auto flex flex-wrap gap-2 border-t border-white/10 pt-4">
        <button
          onClick={() => setShowScript(true)}
          disabled={!canGenerateScript}
          title={!canGenerateScript ? "Réservé aux plans Creator et Pro" : undefined}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Générer le script
        </button>
        <button
          onClick={handleVariants}
          disabled={!canGenerateVariants || variantsLoading}
          title={!canGenerateVariants ? "Réservé aux plans Creator et Pro" : undefined}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {variantsLoading ? "..." : "Créer 5 variantes"}
        </button>
        <button
          onClick={handleSave}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            idea.is_saved
              ? "border-accent bg-accent/20 text-accent-light"
              : "border-white/15 hover:bg-white/5"
          }`}
        >
          {idea.is_saved ? "★ Sauvegardée" : "☆ Sauvegarder"}
        </button>
        <button
          onClick={handleCopy}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/5"
        >
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>

      {showScript && (
        <ScriptPanel ideaId={idea.id} platform={platform} onClose={() => setShowScript(false)} />
      )}
    </div>
  );
}
