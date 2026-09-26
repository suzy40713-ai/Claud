"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import Button from "@/components/ui/Button";
import TournamentCard from "@/components/tournois/TournamentCard";
import { tournois } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const FILTERS = ["Tous", "À venir", "En cours", "Terminé"] as const;

export default function TournoisPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Tous");

  const filtered = useMemo(() => {
    if (filter === "Tous") return tournois;
    return tournois.filter((t) => t.statut === filter);
  }, [filter]);

  return (
    <div>
      <div className="glass sticky top-14 z-30 flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h1 className="flex items-center gap-2 font-display text-lg font-bold">
          <Trophy className="h-5 w-5 text-gold" /> Tournois
        </h1>
        <Link href="/tournois/creer">
          <Button size="sm" variant="gold">
            <Plus className="h-4 w-4" /> Créer
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 px-4 pt-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer",
              filter === f
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-surface-border text-muted hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t, i) => (
          <TournamentCard key={t.id} tournoi={t} delay={i * 0.05} />
        ))}
      </div>
    </div>
  );
}
