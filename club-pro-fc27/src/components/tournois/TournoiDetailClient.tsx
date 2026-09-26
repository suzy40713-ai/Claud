"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Crown, ScrollText, Trophy, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import Confetti from "@/components/ui/Confetti";
import Bracket from "@/components/tournois/Bracket";
import type { BracketMatch, Tournoi } from "@/types";

export default function TournoiDetailClient({ tournoi, bracket }: { tournoi: Tournoi; bracket: BracketMatch[] }) {
  const [inscrit, setInscrit] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (tournoi.vainqueur) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fires the victory confetti once when landing on a finished tournament
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 100);
      return () => clearTimeout(t);
    }
  }, [tournoi.vainqueur]);

  return (
    <div>
      <Confetti active={celebrate} />

      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-surface-2 to-black sm:h-52">
        <Avatar type="club" nom={tournoi.nom} seed={tournoi.image} size="2xl" />
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold">{tournoi.nom}</h1>
          <Badge tone={tournoi.statut === "En cours" ? "green" : tournoi.statut === "Terminé" ? "gray" : "blue"}>
            {tournoi.statut}
          </Badge>
          {tournoi.sponsorise && (
            <Badge tone="gold">
              <Crown className="h-3 w-3" /> {tournoi.cashprize}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">{tournoi.format} · Organisé par {tournoi.organisateur}</p>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(tournoi.dateDebut).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })} →{" "}
            {new Date(tournoi.dateFin).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" /> {tournoi.clubsInscrits}/{tournoi.clubsMax} clubs inscrits
          </span>
        </div>

        {tournoi.vainqueur && (
          <Reveal>
            <Card className="mt-4 flex items-center gap-4 border-gold/30 bg-gradient-to-br from-gold/10 to-surface p-5">
              <motion.div
                initial={{ rotate: -8, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Trophy className="h-10 w-10 text-gold" />
              </motion.div>
              <div>
                <p className="text-xs font-bold tracking-wide text-gold uppercase">Vainqueur du tournoi</p>
                <p className="font-display text-xl font-bold">{tournoi.vainqueur}</p>
              </div>
              <Avatar type="club" nom={tournoi.vainqueur} seed="african-fc" size="lg" className="ml-auto" />
            </Card>
          </Reveal>
        )}

        {tournoi.statut === "À venir" && (
          <div className="mt-4">
            {!inscrit ? (
              <Button variant="gold" onClick={() => setInscrit(true)}>
                S&apos;inscrire en un clic
              </Button>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
                <CheckCircle2 className="h-4 w-4" /> Effectif vérifié — inscription confirmée
              </span>
            )}
          </div>
        )}

        <Reveal className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 font-display text-base font-bold">
            <ScrollText className="h-4 w-4" /> Règlement
          </h2>
          <ul className="space-y-1.5">
            {tournoi.regles.map((r) => (
              <li key={r} className="text-sm text-muted">• {r}</li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mt-8">
          <h2 className="mb-3 font-display text-base font-bold">Bracket</h2>
          <Bracket matches={bracket} />
        </Reveal>
      </div>
    </div>
  );
}
