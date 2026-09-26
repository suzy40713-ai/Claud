"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import type { BracketMatch } from "@/types";
import { cn } from "@/lib/utils";

export default function Bracket({ matches }: { matches: BracketMatch[] }) {
  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);

  return (
    <div className="no-scrollbar flex gap-6 overflow-x-auto pb-4">
      {rounds.map((round, ri) => (
        <div key={round} className="flex w-64 shrink-0 flex-col justify-around gap-6">
          <p className="text-center text-xs font-bold tracking-wide text-muted uppercase">
            {round === rounds[rounds.length - 1] ? "Finale" : `Round ${round}`}
          </p>
          {matches
            .filter((m) => m.round === round)
            .map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: ri * 0.15 + i * 0.08, duration: 0.4 }}
                className="rounded-xl border border-surface-border bg-surface p-2.5"
              >
                <Team nom={m.clubA} logo={m.clubALogo} score={m.scoreA} vainqueur={m.vainqueur === m.clubA} />
                <div className="my-1 h-px bg-surface-border" />
                <Team nom={m.clubB} logo={m.clubBLogo} score={m.scoreB} vainqueur={m.vainqueur === m.clubB} />
                <p
                  className={cn(
                    "mt-2 text-center text-[10px] font-semibold",
                    m.statut === "En cours" && "text-live",
                    m.statut === "À venir" && "text-muted",
                    m.statut === "Terminé" && "text-accent"
                  )}
                >
                  {m.statut}
                </p>
              </motion.div>
            ))}
        </div>
      ))}
    </div>
  );
}

function Team({
  nom,
  logo,
  score,
  vainqueur,
}: {
  nom?: string;
  logo?: string;
  score?: number;
  vainqueur?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 rounded-lg px-1.5 py-1", vainqueur && "bg-accent/10")}>
      {nom ? (
        <Avatar type="club" nom={nom} seed={logo} size="xs" />
      ) : (
        <div className="h-6 w-6 rounded-full border border-dashed border-white/15" />
      )}
      <span className={cn("min-w-0 flex-1 truncate text-xs", vainqueur ? "font-bold text-accent" : "text-foreground/80")}>
        {nom ?? "À déterminer"}
      </span>
      {vainqueur && <Crown className="h-3 w-3 shrink-0 text-gold" />}
      {score !== undefined && <span className="shrink-0 text-xs font-bold">{score}</span>}
    </div>
  );
}
