"use client";

import Link from "next/link";
import { Compass, Trophy, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ArchetypeBadge from "@/components/ui/ArchetypeBadge";
import DivisionBadge from "@/components/ui/DivisionBadge";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import TournamentCard from "@/components/tournois/TournamentCard";
import { clubs, joueurs, tournois } from "@/lib/mock-data";
import { POSTE_LABELS } from "@/lib/constants";
import { formatNombre } from "@/lib/utils";

export default function ExplorerPage() {
  const topClubs = [...clubs].sort((a, b) => a.classementRang - b.classementRang).slice(0, 6);
  const topJoueurs = [...joueurs]
    .filter((j) => j.id !== "moi")
    .sort((a, b) => b.noteGlobale - a.noteGlobale)
    .slice(0, 8);
  const upcoming = tournois.filter((t) => t.statut !== "Terminé").slice(0, 3);

  return (
    <div>
      <div className="glass sticky top-14 z-30 border-b border-surface-border px-4 py-3">
        <h1 className="flex items-center gap-2 font-display text-lg font-bold">
          <Compass className="h-5 w-5 text-accent" /> Explorer
        </h1>
        <p className="text-xs text-muted">Les clubs, joueurs et tournois qui font l&apos;actualité</p>
      </div>

      <section className="p-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold">
          <Users className="h-4 w-4 text-accent" /> Clubs à la une
        </h2>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {topClubs.map((c, i) => (
            <Reveal key={c.id} delay={i * 0.05} className="shrink-0">
              <Link href={`/club/${c.id}`}>
                <Card className="w-40 p-3 text-center">
                  <Avatar type="club" nom={c.nom} seed={c.id} size="lg" className="mx-auto" />
                  <p className="mt-2 truncate text-sm font-semibold">{c.nom}</p>
                  <p className="text-xs text-muted">Rang #{c.classementRang}</p>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="p-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold">
          <Trophy className="h-4 w-4 text-gold" /> Joueurs en forme
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {topJoueurs.map((j, i) => (
            <Reveal key={j.id} delay={i * 0.04}>
              <Link href={`/joueur/${j.id}`}>
                <Card className="flex items-center gap-3 p-3">
                  <Avatar type="joueur" nom={j.pseudo} seed={j.id} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{j.pseudo}</p>
                    <p className="truncate text-xs text-muted">
                      {POSTE_LABELS[j.poste]} · {formatNombre(j.followers)} abonnés
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <ArchetypeBadge archetype={j.archetype} size="sm" />
                      <DivisionBadge division={j.division} size="sm" />
                    </div>
                  </div>
                  <span className="font-display text-lg font-bold text-accent">{j.noteGlobale}</span>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="p-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold">
          <Trophy className="h-4 w-4 text-gold" /> Tournois à suivre
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((t, i) => (
            <TournamentCard key={t.id} tournoi={t} delay={i * 0.05} />
          ))}
        </div>
      </section>
    </div>
  );
}
