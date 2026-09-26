"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, BarChart3, Minus, RefreshCcw, Swords } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Reveal from "@/components/ui/Reveal";
import { classement as classementInitial } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Club } from "@/types";

const SAISONS = ["Saison 5 (en cours)", "Saison 4", "Saison 3"];

export default function ClassementPage() {
  const [saison, setSaison] = useState(SAISONS[0]);
  const [elos, setElos] = useState(() =>
    Object.fromEntries(classementInitial.map((c) => [c.club.id, c.elo]))
  );
  const [prevRangs, setPrevRangs] = useState<Record<string, number>>(() =>
    Object.fromEntries(classementInitial.map((c) => [c.club.id, c.rang]))
  );
  const [defi, setDefi] = useState<Club | null>(null);
  const [defiSent, setDefiSent] = useState(false);

  const sorted = useMemo(() => {
    const list = classementInitial
      .map((c) => ({ ...c, elo: elos[c.club.id] }))
      .sort((a, b) => b.elo - a.elo);
    return list.map((c, i) => ({ ...c, rang: i + 1 }));
  }, [elos]);

  const actualiser = () => {
    setPrevRangs(Object.fromEntries(sorted.map((c) => [c.club.id, c.rang])));
    setElos((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = Math.max(1800, next[key] + Math.round((Math.random() - 0.5) * 120));
      }
      return next;
    });
  };

  return (
    <div className="p-4">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="flex items-center gap-2 font-display text-xl font-bold">
          <BarChart3 className="h-5 w-5 text-accent" /> Classement
        </h1>
        <Button size="sm" variant="outline" onClick={actualiser}>
          <RefreshCcw className="h-3.5 w-3.5" /> Actualiser
        </Button>
      </div>
      <p className="mb-4 text-sm text-muted">Ladder ELO des clubs Club Pro FC 27.</p>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {SAISONS.map((s) => (
          <button
            key={s}
            onClick={() => setSaison(s)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer",
              saison === s
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-surface-border text-muted hover:text-foreground"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {sorted.map((c, i) => {
          const prevRang = prevRangs[c.club.id] ?? c.rang;
          const delta = prevRang - c.rang;
          return (
            <motion.div key={c.club.id} layout transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <Reveal delay={i * 0.03} y={8}>
                <Card className="flex items-center gap-3 p-3">
                  <div className="flex w-10 shrink-0 flex-col items-center">
                    <span className="font-display text-lg font-bold">{c.rang}</span>
                    {delta > 0 && (
                      <span className="flex items-center text-[10px] font-semibold text-accent">
                        <ArrowUp className="h-3 w-3" /> {delta}
                      </span>
                    )}
                    {delta < 0 && (
                      <span className="flex items-center text-[10px] font-semibold text-red-400">
                        <ArrowDown className="h-3 w-3" /> {Math.abs(delta)}
                      </span>
                    )}
                    {delta === 0 && <Minus className="h-3 w-3 text-muted" />}
                  </div>
                  <Link href={`/club/${c.club.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                    <Avatar type="club" nom={c.club.nom} seed={c.club.id} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.club.nom}</p>
                      <p className="text-xs text-muted">{c.elo} ELO</p>
                    </div>
                  </Link>
                  <div className="hidden gap-1 sm:flex">
                    {c.serie.map((r, si) => (
                      <span
                        key={si}
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
                          r === "V" && "bg-accent/15 text-accent",
                          r === "D" && "bg-danger/15 text-red-400",
                          r === "N" && "bg-white/10 text-muted"
                        )}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setDefi(c.club)}>
                    <Swords className="h-3.5 w-3.5" /> Défier
                  </Button>
                </Card>
              </Reveal>
            </motion.div>
          );
        })}
      </div>

      <Modal
        open={!!defi}
        onClose={() => { setDefi(null); setDefiSent(false); }}
        title={defi ? `Défier ${defi.nom}` : ""}
      >
        {!defiSent ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Envoyer une demande de match officiel à {defi?.nom}. En cas d&apos;acceptation, le match sera ajouté au calendrier.
            </p>
            <Button className="w-full" onClick={() => setDefiSent(true)}>
              Envoyer le défi
            </Button>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted">Défi envoyé ! {defi?.nom} a été notifié.</p>
        )}
      </Modal>
    </div>
  );
}
