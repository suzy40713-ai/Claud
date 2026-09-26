"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Trophy } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Confetti from "@/components/ui/Confetti";
import Reveal from "@/components/ui/Reveal";

const FORMATS = ["11 vs 11", "4 vs 4", "3 vs 3", "2 vs 2", "1 vs 1"];

export default function CreerTournoiPage() {
  const [nom, setNom] = useState("");
  const [format, setFormat] = useState(FORMATS[0]);
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [clubsMax, setClubsMax] = useState(16);
  const [sponsorise, setSponsorise] = useState(false);
  const [cashprize, setCashprize] = useState("");
  const [regles, setRegles] = useState("Fair-play obligatoire\nEffectif minimum requis pour valider un match");
  const [created, setCreated] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const submit = () => {
    if (!nom.trim() || !dateDebut || !dateFin) return;
    setCreated(true);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 100);
  };

  if (created) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <Confetti active={celebrate} />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/15"
        >
          <CheckCircle2 className="h-11 w-11 text-accent" />
        </motion.div>
        <h1 className="font-display text-2xl font-bold">Tournoi créé !</h1>
        <p className="max-w-sm text-sm text-muted">
          &ldquo;{nom}&rdquo; est maintenant visible dans le calendrier des tournois. Les clubs peuvent s&apos;inscrire dès maintenant.
        </p>
        <Link href="/tournois">
          <Button>Voir les tournois</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-1 flex items-center gap-2 font-display text-xl font-bold">
        <Trophy className="h-5 w-5 text-gold" /> Créer un tournoi
      </h1>
      <p className="mb-5 text-sm text-muted">
        N&apos;importe quel club peut organiser son propre tournoi. Définissez les règles et le format.
      </p>

      <Reveal>
        <Card className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Nom du tournoi</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="ex: Coupe des Champions FC27"
              className="w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm placeholder:text-muted focus:border-accent/40 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:outline-none"
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Clubs max.</label>
              <input
                type="number"
                min={4}
                max={64}
                value={clubsMax}
                onChange={(e) => setClubsMax(Number(e.target.value))}
                className="w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Date de début</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Date de fin</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Règles (une par ligne)</label>
            <textarea
              value={regles}
              onChange={(e) => setRegles(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-2 p-3">
            <div>
              <p className="text-sm font-semibold">Tournoi sponsorisé</p>
              <p className="text-xs text-muted">Ajoute un cashprize et un badge doré mis en avant</p>
            </div>
            <button
              onClick={() => setSponsorise((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${sponsorise ? "bg-gold" : "bg-white/15"}`}
            >
              <motion.span
                animate={{ x: sponsorise ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 h-4 w-4 rounded-full bg-white"
              />
            </button>
          </div>

          {sponsorise && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Cashprize</label>
              <input
                value={cashprize}
                onChange={(e) => setCashprize(e.target.value)}
                placeholder="ex: 2 000 €"
                className="w-full rounded-xl border border-gold/30 bg-surface-2 p-2.5 text-sm placeholder:text-muted focus:outline-none"
              />
            </div>
          )}

          <p className="text-[11px] text-muted">
            Une vérification automatique de l&apos;effectif minimum sera exigée pour chaque club avant de valider son inscription.
          </p>

          <Button className="w-full" size="lg" onClick={submit} disabled={!nom.trim() || !dateDebut || !dateFin}>
            Créer le tournoi
          </Button>
        </Card>
      </Reveal>
    </div>
  );
}
