"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IdeaCard } from "@/components/dashboard/idea-card";
import type { Idea } from "@/lib/supabase/types";

export function SavedIdeas({
  canGenerateScript,
  canGenerateVariants,
}: {
  canGenerateScript: boolean;
  canGenerateVariants: boolean;
}) {
  const supabase = createClient();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ideas")
        .select("*")
        .eq("is_saved", true)
        .order("created_at", { ascending: false });
      setIdeas((data as Idea[]) || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSaveToggle(idea: Idea) {
    setIdeas((prev) => prev.filter((i) => i.id !== idea.id));
  }

  function handleVariants(variants: Idea[]) {
    setIdeas((prev) => [...prev, ...variants.filter((v) => v.is_saved)]);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Idées sauvegardées</h1>
      <p className="mt-1 text-white/60">Retrouve toutes tes idées mises de côté.</p>

      {loading && <p className="mt-6 text-white/50">Chargement...</p>}
      {!loading && ideas.length === 0 && (
        <p className="mt-6 text-white/50">Aucune idée sauvegardée pour l'instant.</p>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            platform={idea.platform}
            canGenerateScript={canGenerateScript}
            canGenerateVariants={canGenerateVariants}
            onSaveToggle={handleSaveToggle}
            onVariants={handleVariants}
          />
        ))}
      </div>
    </div>
  );
}
