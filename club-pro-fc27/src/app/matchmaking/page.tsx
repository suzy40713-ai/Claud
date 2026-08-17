"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCheck, Flag, Swords, Users, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import RadarLoader from "@/components/ui/RadarLoader";
import Reveal from "@/components/ui/Reveal";
import { matchsRapides } from "@/lib/mock-data";
import { tempsRelatif } from "@/lib/utils";
import { cn } from "@/lib/utils";

const FORMATS = ["1v1", "2v2", "3v3", "4v4"] as const;
type Format = (typeof FORMATS)[number];
type Etat = "idle" | "recherche" | "trouve" | "salon";

const ADVERSAIRES = ["Team Falcon", "Zizou_Pro", "Team Nova", "Squad Phoenix", "RivalSquad", "AtlasGamers"];

export default function MatchmakingPage() {
  const [format, setFormat] = useState<Format>("2v2");
  const [etat, setEtat] = useState<Etat>("idle");
  const [tempsAttente, setTempsAttente] = useState(0);
  const [adversaire, setAdversaire] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const lancerRecherche = () => {
    setEtat("recherche");
    setTempsAttente(0);
    timerRef.current = setInterval(() => setTempsAttente((t) => t + 1), 1000);
    timeoutRef.current = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setAdversaire(ADVERSAIRES[Math.floor(Math.random() * ADVERSAIRES.length)]);
      setEtat("trouve");
      timeoutRef.current = setTimeout(() => setEtat("salon"), 1600);
    }, 3800);
  };

  const annuler = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setEtat("idle");
  };

  const quitterSalon = () => {
    setEtat("idle");
    setReportSent(false);
  };

  return (
    <div className="p-4">
      <h1 className="mb-1 flex items-center gap-2 font-display text-xl font-bold">
        <Swords className="h-5 w-5 text-accent" /> Matchmaking rapide
      </h1>
      <p className="mb-6 text-sm text-muted">Trouvez un adversaire instantanément selon le format de votre choix.</p>

      <AnimatePresence mode="wait">
        {etat === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold">Choisir un format</p>
              <div className="mb-5 grid grid-cols-4 gap-2">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "rounded-xl border py-3 text-center text-sm font-bold transition-colors cursor-pointer",
                      format === f
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-surface-border text-muted hover:text-foreground"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <Button size="lg" className="w-full" onClick={lancerRecherche}>
                Lancer la recherche {format}
              </Button>
            </Card>
          </motion.div>
        )}

        {etat === "recherche" && (
          <motion.div
            key="recherche"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center gap-5 py-10"
          >
            <RadarLoader />
            <div className="text-center">
              <p className="font-display text-lg font-bold">Recherche d&apos;adversaire {format}...</p>
              <p className="text-sm text-muted">Temps écoulé : {tempsAttente}s · Estimation ~4s</p>
            </div>
            <Button variant="outline" onClick={annuler}>
              <X className="h-4 w-4" /> Annuler
            </Button>
          </motion.div>
        )}

        {etat === "trouve" && (
          <motion.div
            key="trouve"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-14"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15"
            >
              <CheckCheck className="h-9 w-9 text-accent" />
            </motion.div>
            <p className="font-display text-xl font-bold">Adversaire trouvé !</p>
            <p className="text-sm text-muted">{adversaire} — entrée dans le salon d&apos;attente...</p>
          </motion.div>
        )}

        {etat === "salon" && (
          <motion.div key="salon" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <Badge tone="green">Salon d&apos;attente — {format}</Badge>
                <button onClick={() => setReportOpen(true)} className="flex items-center gap-1 text-xs text-muted hover:text-red-400 cursor-pointer">
                  <Flag className="h-3.5 w-3.5" /> Signaler
                </button>
              </div>
              <div className="flex items-center justify-center gap-8 py-4">
                <div className="flex flex-col items-center gap-2">
                  <Avatar type="joueur" nom="VousMeme" seed="moi" size="lg" />
                  <p className="text-sm font-semibold">VousMeme</p>
                  <Badge tone="green">Prêt</Badge>
                </div>
                <span className="font-display text-2xl font-bold text-muted">VS</span>
                <div className="flex flex-col items-center gap-2">
                  <Avatar type="joueur" nom={adversaire} seed={adversaire} size="lg" />
                  <p className="text-sm font-semibold">{adversaire}</p>
                  <Badge tone="green">Prêt</Badge>
                </div>
              </div>
              <p className="mb-4 text-center text-xs text-muted">
                Discutez avant le lancement du match. Tout no-show sera signalé automatiquement.
              </p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={quitterSalon}>Lancer le match</Button>
                <Button variant="outline" onClick={quitterSalon}>Quitter</Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold">
          <Users className="h-4 w-4" /> Historique des matchs rapides
        </h2>
        <div className="space-y-2">
          {matchsRapides.map((m, i) => (
            <Reveal key={m.id} delay={i * 0.05}>
              <Card className="flex items-center gap-3 p-3">
                <Avatar type="joueur" nom={m.adversaire} seed={m.adversaireAvatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">vs {m.adversaire}</p>
                  <p className="text-xs text-muted">{m.format} · {tempsRelatif(m.date)}</p>
                </div>
                <span className="font-display font-bold">{m.score}</span>
                <Badge
                  tone={m.resultat === "Victoire" ? "green" : m.resultat === "Défaite" ? "red" : "gray"}
                >
                  {m.resultat}
                </Badge>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>

      <Modal open={reportOpen} onClose={() => { setReportOpen(false); setReportSent(false); }} title="Signaler un comportement">
        {!reportSent ? (
          <div className="space-y-3">
            {["No-show / abandon", "Triche suspectée", "Comportement toxique", "Autre"].map((r) => (
              <button
                key={r}
                onClick={() => setReportSent(true)}
                className="flex w-full items-center gap-2 rounded-xl border border-surface-border bg-surface-2 p-3 text-left text-sm hover:border-red-400/40 hover:bg-red-400/5 cursor-pointer"
              >
                <AlertTriangle className="h-4 w-4 text-red-400" /> {r}
              </button>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted">
            <CheckCheck className="mx-auto mb-2 h-8 w-8 text-accent" />
            Signalement envoyé à la modération. Merci de contribuer à une communauté saine.
          </div>
        )}
      </Modal>
    </div>
  );
}
