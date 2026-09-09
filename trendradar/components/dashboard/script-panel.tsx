"use client";

import { useEffect, useState } from "react";
import type { Platform } from "@/lib/supabase/types";

interface ScriptData {
  hook: string | null;
  introduction: string | null;
  development: string | null;
  conclusion: string | null;
  cta: string | null;
  estimated_duration: string | null;
  narration_notes: string | null;
  on_screen_text: string | null;
  visual_ideas: string | null;
}

const MODES: { key: "captivating" | "shorter" | "suspense" | "alternative"; label: string }[] = [
  { key: "captivating", label: "Rendre plus captivant" },
  { key: "shorter", label: "Raccourcir" },
  { key: "suspense", label: "Ajouter du suspense" },
  { key: "alternative", label: "Générer une autre version" },
];

export function ScriptPanel({
  ideaId,
  platform,
  onClose,
}: {
  ideaId: string;
  platform: Platform;
  onClose: () => void;
}) {
  const [script, setScript] = useState<ScriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchScript(mode?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, platform, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setScript(data.script);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchScript();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-surface p-6 scrollbar-thin">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Script généré</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            ✕
          </button>
        </div>

        {loading && <p className="py-8 text-center text-white/50">Génération en cours...</p>}
        {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        {script && !loading && (
          <div className="space-y-4">
            {script.estimated_duration && (
              <p className="text-xs font-medium text-white/40">
                Durée estimée : {script.estimated_duration}
              </p>
            )}
            {[
              { label: "Hook", value: script.hook },
              { label: "Introduction", value: script.introduction },
              { label: "Développement", value: script.development },
              { label: "Conclusion", value: script.conclusion },
              { label: "CTA", value: script.cta },
              { label: "Narration", value: script.narration_notes },
              { label: "Texte à l'écran", value: script.on_screen_text },
              { label: "Idées visuelles", value: script.visual_ideas },
            ].map(
              (block) =>
                block.value && (
                  <div key={block.label}>
                    <p className="text-xs font-medium uppercase tracking-wide text-white/40">
                      {block.label}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                      {block.value}
                    </p>
                  </div>
                )
            )}

            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => fetchScript(m.key)}
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium hover:bg-white/5"
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
