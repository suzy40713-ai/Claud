"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Flame,
  Globe2,
  Lock,
  PlayCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ArchetypeBadge from "@/components/ui/ArchetypeBadge";
import DivisionBadge from "@/components/ui/DivisionBadge";
import StatCounter from "@/components/ui/StatCounter";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import Confetti from "@/components/ui/Confetti";
import { clubs, joueurs } from "@/lib/mock-data";
import { POSTE_LABELS, POSTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Poste } from "@/types";

const afc = clubs[0];
const stars = joueurs.filter((j) => afc.effectif.includes(j.id)).sort((a, b) => b.noteGlobale - a.noteGlobale);

export default function AfricanFcPage() {
  const [poste, setPoste] = useState<Poste>("BU");
  const [pseudo, setPseudo] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const totalMatchs = afc.stats.victoires + afc.stats.nuls + afc.stats.defaites;
  const winRate = Math.round((afc.stats.victoires / totalMatchs) * 100);

  const submit = () => {
    if (!pseudo.trim()) return;
    setSent(true);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 100);
  };

  return (
    <div>
      <Confetti active={celebrate} />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-surface-border">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 15% 0%, rgba(23,229,138,0.18), transparent 55%), radial-gradient(circle at 85% 10%, rgba(242,193,78,0.14), transparent 45%), #06080a",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative px-5 py-14 text-center sm:py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
            className="mx-auto mb-5 flex justify-center"
          >
            <Avatar type="club" nom={afc.nom} seed={afc.id} size="2xl" className="h-28 w-28 rounded-3xl text-4xl shadow-[0_0_60px_rgba(23,229,138,0.35)]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold tracking-wide text-gold uppercase"
          >
            <Flame className="h-3.5 w-3.5" /> Page vitrine officielle
          </motion.div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-6xl">
            <span className="text-gradient-accent">African</span> <span className="text-gradient-gold">FC</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted sm:text-base">
            Le projet qui rassemble les meilleurs talents Pro Clubs du continent africain — et du monde entier.
            Discipline, ambition, excellence collective. Rejoignez la légende.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a href="#postuler">
              <Button variant="gold" size="lg" pulse>
                <Flame className="h-4.5 w-4.5" /> Postuler à African FC
              </Button>
            </a>
            <Link href={`/club/${afc.id}`}>
              <Button variant="outline" size="lg">
                Voir le profil complet
              </Button>
            </Link>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Rang mondial", value: afc.classementRang, prefix: "#" },
              { label: "ELO", value: afc.classementElo },
              { label: "Taux de victoire", value: winRate, suffix: "%" },
              { label: "Abonnés", value: afc.followers },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-surface-border bg-surface/60 p-3">
                <StatCounter value={s.value} prefix={s.prefix} suffix={s.suffix} className="text-xl font-bold text-accent sm:text-2xl" />
                <p className="mt-1 text-[11px] text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO DE PRESENTATION */}
      <section className="px-5 py-10">
        <Reveal>
          <h2 className="mb-4 font-display text-xl font-bold">Vidéo de présentation</h2>
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-surface-border bg-gradient-to-br from-accent/10 via-surface to-black">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative z-10 cursor-pointer">
              <PlayCircle className="h-16 w-16 text-white/90 sm:h-20 sm:w-20" />
            </motion.button>
            <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white/80">
              &quot;Le Projet African FC&quot; — 2:14
            </span>
          </div>
        </Reveal>
      </section>

      {/* CRITERES DE RECRUTEMENT */}
      <section className="px-5 py-10">
        <Reveal>
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <h2 className="font-display text-xl font-bold">Critères de recrutement stricts</h2>
          </div>
          <p className="mb-5 max-w-2xl text-sm text-muted">
            African FC ne recrute que l&apos;excellence. Chaque candidat est évalué sur son niveau, son
            archétype et sa régularité. Voici les postes actuellement ouverts :
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {afc.posteRecherche.map((p, i) => (
            <Reveal key={`${p.poste}-${i}`} delay={i * 0.05}>
              <Card className={cn("p-4", p.pourvu && "opacity-50")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-bold">{POSTE_LABELS[p.poste]}</p>
                    {p.archetype && (
                      <div className="mt-1.5">
                        <ArchetypeBadge archetype={p.archetype} size="sm" />
                      </div>
                    )}
                    <p className="mt-2 text-xs text-muted">Niveau minimum : {p.niveauMin}</p>
                  </div>
                  {p.pourvu ? (
                    <Badge tone="gray"><Lock className="h-3 w-3" /> Complet</Badge>
                  ) : (
                    <Badge tone="gold"><Sparkles className="h-3 w-3" /> Ouvert</Badge>
                  )}
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* STATS & CLASSEMENT */}
      <section className="px-5 py-10">
        <Reveal>
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" />
            <h2 className="font-display text-xl font-bold">Statistiques & classement</h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Matchs joués", value: afc.stats.matchsJoues },
            { label: "Victoires", value: afc.stats.victoires },
            { label: "Buts marqués", value: afc.stats.butsMarques },
            { label: "Buts encaissés", value: afc.stats.butsEncaisses },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.05}>
              <Card className="p-4 text-center">
                <StatCounter value={s.value} className="text-2xl font-bold text-accent" />
                <p className="mt-1 text-xs text-muted">{s.label}</p>
              </Card>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-4">
          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold">Palmarès</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {afc.palmares.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-muted">
                  <Trophy className="h-4 w-4 shrink-0 text-gold" /> {p}
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>
      </section>

      {/* EFFECTIF VEDETTE */}
      <section className="px-5 py-10">
        <Reveal>
          <h2 className="mb-4 font-display text-xl font-bold">Nos joueurs vedettes</h2>
        </Reveal>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
          {stars.map((j, i) => (
            <Reveal key={j.id} delay={i * 0.06} className="shrink-0">
              <Link href={`/joueur/${j.id}`}>
                <Card className="w-44 p-3 text-center">
                  <Avatar type="joueur" nom={j.pseudo} seed={j.id} size="lg" className="mx-auto" />
                  <p className="mt-2 truncate text-sm font-semibold">{j.pseudo}</p>
                  <p className="text-xs text-muted">{POSTE_LABELS[j.poste]}</p>
                  <div className="mt-2 flex flex-col items-center gap-1">
                    <ArchetypeBadge archetype={j.archetype} size="sm" />
                    <DivisionBadge division={j.division} size="sm" />
                  </div>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* POSTULER */}
      <section id="postuler" className="scroll-mt-20 px-5 py-14">
        <Reveal className="mx-auto max-w-lg">
          <Card className="border-gold/25 bg-gradient-to-br from-gold/8 via-surface to-surface p-6">
            {!sent ? (
              <>
                <div className="mb-1 flex items-center gap-2 text-gold">
                  <Flame className="h-5 w-5" />
                  <h2 className="font-display text-xl font-bold text-foreground">Rejoindre African FC</h2>
                </div>
                <p className="mb-5 text-sm text-muted">
                  Envoyez votre candidature. Notre staff examine chaque profil selon le poste, l&apos;archétype
                  et le niveau minimum requis.
                </p>

                <label className="mb-1 block text-xs font-medium text-muted">Poste souhaité</label>
                <select
                  value={poste}
                  onChange={(e) => setPoste(e.target.value as Poste)}
                  className="mb-4 w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:border-gold/40 focus:outline-none"
                >
                  {POSTES.map((p) => (
                    <option key={p} value={p}>
                      {POSTE_LABELS[p]}
                    </option>
                  ))}
                </select>

                <label className="mb-1 block text-xs font-medium text-muted">Votre pseudo</label>
                <input
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  placeholder="ex: VousMeme"
                  className="mb-4 w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm placeholder:text-muted focus:border-gold/40 focus:outline-none"
                />

                <label className="mb-1 block text-xs font-medium text-muted">Message (optionnel)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Parlez-nous de votre niveau, votre archétype, votre disponibilité..."
                  className="mb-5 w-full resize-none rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm placeholder:text-muted focus:border-gold/40 focus:outline-none"
                />

                <Button variant="gold" size="lg" className="w-full" onClick={submit} disabled={!pseudo.trim()}>
                  <Send className="h-4 w-4" /> Envoyer ma candidature
                </Button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15"
                >
                  <CheckCircle2 className="h-9 w-9 text-accent" />
                </motion.div>
                <h3 className="font-display text-xl font-bold">Candidature envoyée !</h3>
                <p className="mt-2 text-sm text-muted">
                  Bienvenue potentiel, {pseudo} 🔥 Le staff African FC va étudier votre profil pour le poste
                  {" "}
                  {POSTE_LABELS[poste]}. Consultez votre messagerie pour la suite.
                </p>
                <Link href="/messages">
                  <Button variant="outline" className="mt-4">
                    Aller à la messagerie
                  </Button>
                </Link>
              </motion.div>
            )}
          </Card>
        </Reveal>
        <Reveal delay={0.1} className="mx-auto mt-4 flex max-w-lg items-center justify-center gap-2 text-xs text-muted">
          <Globe2 className="h-3.5 w-3.5" /> Ouvert aux joueurs du monde entier — francophones et anglophones bienvenus.
        </Reveal>
      </section>
    </div>
  );
}
