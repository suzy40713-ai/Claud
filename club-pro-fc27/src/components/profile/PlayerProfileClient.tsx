"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Clock,
  Globe2,
  MapPin,
  MessageCircle,
  PlayCircle,
  Plus,
  UserPlus,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ArchetypeBadge from "@/components/ui/ArchetypeBadge";
import DivisionBadge from "@/components/ui/DivisionBadge";
import LevelBar from "@/components/ui/LevelBar";
import StatCounter from "@/components/ui/StatCounter";
import StarRating from "@/components/ui/StarRating";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import Modal from "@/components/ui/Modal";
import Reveal from "@/components/ui/Reveal";
import DynamicIcon from "@/components/ui/DynamicIcon";
import Confetti from "@/components/ui/Confetti";
import type { Joueur, Evaluation } from "@/types";
import { POSTE_LABELS } from "@/lib/constants";
import { formatNombre, tempsRelatif } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUT_TONE = {
  Libre: "green",
  "En club": "blue",
  "En essai": "gold",
} as const;

export default function PlayerProfileClient({ joueur }: { joueur: Joueur }) {
  const [tab, setTab] = useState("apercu");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(joueur.followers);
  const [evalOpen, setEvalOpen] = useState(false);
  const [evaluations, setEvaluations] = useState<Evaluation[]>(joueur.evaluations);
  const [celebrate, setCelebrate] = useState(false);

  const toggleFollow = () => {
    setFollowing((v) => !v);
    setFollowers((v) => (following ? v - 1 : v + 1));
  };

  const addEvaluation = (evalData: Omit<Evaluation, "id" | "date">) => {
    setEvaluations((prev) => [
      { ...evalData, id: `ev-${Date.now()}`, date: new Date().toISOString() },
      ...prev,
    ]);
    setEvalOpen(false);
    if (evalData.fairPlay + evalData.ponctualite + evalData.niveau >= 13) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 100);
    }
  };

  return (
    <div>
      <Confetti active={celebrate} />
      {/* Bannière */}
      <div
        className="relative h-36 w-full sm:h-48"
        style={{
          background: `linear-gradient(135deg, ${joueur.bannerColor}55, #06080a)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="px-4">
        <div className="-mt-14 flex items-end justify-between sm:-mt-16">
          <Avatar type="joueur" nom={joueur.pseudo} seed={joueur.avatar} size="2xl" ring className="h-24 w-24 text-3xl sm:h-32 sm:w-32" />
          <div className="flex gap-2 pb-2">
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4" /> Message
            </Button>
            <Button
              variant={following ? "outline" : "primary"}
              size="sm"
              onClick={toggleFollow}
            >
              {following ? "Abonné" : (
                <>
                  <UserPlus className="h-4 w-4" /> Suivre
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold">{joueur.pseudo}</h1>
          {joueur.verifie && <BadgeCheck className="h-5 w-5 fill-accent text-background" />}
          <Badge tone={STATUT_TONE[joueur.statut]}>{joueur.statut}</Badge>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span className="font-semibold text-foreground">{POSTE_LABELS[joueur.poste]}</span>
          <ArchetypeBadge archetype={joueur.archetype} size="sm" />
          <DivisionBadge division={joueur.division} size="sm" />
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/90">{joueur.bio}</p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {joueur.region}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {joueur.disponibilite}</span>
          <span className="flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" /> {joueur.langues.join(", ")}</span>
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          <span><b>{formatNombre(followers)}</b> <span className="text-muted">abonnés</span></span>
          <span><b>{formatNombre(joueur.following)}</b> <span className="text-muted">abonnements</span></span>
        </div>

        <Card className="my-4 p-4">
          <LevelBar niveau={joueur.niveauPro} niveauMax={Math.max(joueur.niveauProMax, 100)} />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Note globale" value={joueur.noteGlobale} suffix="" />
            <MiniStat label="Buts" value={joueur.stats.buts} />
            <MiniStat label="Passes D." value={joueur.stats.passesD} />
            <MiniStat label="Victoires" value={joueur.stats.tauxVictoire} suffix="%" />
          </div>
        </Card>
      </div>

      <Tabs
        className="player-tabs px-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "apercu", label: "Aperçu" },
          { id: "stats", label: "Statistiques" },
          { id: "historique", label: "Historique" },
          { id: "videos", label: "Vidéos", count: joueur.videos.length },
          { id: "evaluations", label: "Évaluations", count: evaluations.length },
        ]}
      />

      <div className="p-4">
        {tab === "apercu" && (
          <Reveal className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-2 font-display font-bold">Style de jeu</h3>
              <p className="text-sm text-muted">{joueur.styleDeJeu}</p>
            </Card>
            <Card className="p-4">
              <h3 className="mb-3 font-display font-bold">Badges & certifications</h3>
              {joueur.badges.length === 0 ? (
                <p className="text-sm text-muted">Aucun badge pour le moment.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {joueur.badges.map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold"
                    >
                      <DynamicIcon name={b.icon} className="h-3.5 w-3.5" />
                      {b.label}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </Reveal>
        )}

        {tab === "stats" && (
          <Reveal className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Matchs joués", value: joueur.stats.matchsJoues },
              { label: "Buts", value: joueur.stats.buts },
              { label: "Passes décisives", value: joueur.stats.passesD },
              { label: "Victoires", value: joueur.stats.victoires },
              { label: "Défaites", value: joueur.stats.defaites },
              { label: "Taux de victoire", value: joueur.stats.tauxVictoire, suffix: "%" },
              { label: "Note moyenne / match", value: joueur.stats.noteMoyenneMatch, decimals: 1 },
              { label: "Niveau Pro", value: joueur.niveauPro },
            ].map((s) => (
              <Card key={s.label} className="p-4 text-center">
                <StatCounter value={s.value} suffix={s.suffix} decimals={s.decimals} className="text-2xl font-bold text-accent" />
                <p className="mt-1 text-xs text-muted">{s.label}</p>
              </Card>
            ))}
          </Reveal>
        )}

        {tab === "historique" && (
          <Reveal>
            {joueur.historiqueClubs.length === 0 ? (
              <p className="text-sm text-muted">Aucun club dans l&apos;historique.</p>
            ) : (
              <ol className="relative space-y-5 border-l border-surface-border pl-5">
                {joueur.historiqueClubs.map((h) => (
                  <li key={h.clubId + h.periode} className="relative">
                    <span
                      className={cn(
                        "absolute top-1.5 -left-[26px] h-3 w-3 rounded-full border-2 border-background",
                        h.statut === "Actuel" ? "bg-accent" : "bg-muted"
                      )}
                    />
                    <Link href={`/club/${h.clubId}`} className="flex items-center gap-3 group">
                      <Avatar type="club" nom={h.clubNom} seed={h.clubLogo} size="sm" />
                      <div>
                        <p className="text-sm font-semibold group-hover:text-accent">{h.clubNom}</p>
                        <p className="text-xs text-muted">{h.periode} · {h.poste}</p>
                      </div>
                      {h.statut === "Actuel" && <Badge tone="green" className="ml-auto">Actuel</Badge>}
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Reveal>
        )}

        {tab === "videos" && (
          <Reveal className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {joueur.videos.length === 0 ? (
              <p className="text-sm text-muted">Aucune vidéo publiée.</p>
            ) : (
              joueur.videos.map((v) => (
                <Card key={v.id} className="overflow-hidden p-0">
                  <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-surface-2 to-black">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <PlayCircle className="h-12 w-12 text-white/90" />
                    </motion.button>
                    <Badge tone="gray" className="absolute top-2 right-2">{v.plateforme}</Badge>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{v.titre}</p>
                    <p className="text-xs text-muted">{formatNombre(v.vues)} vues · {tempsRelatif(v.date)}</p>
                  </div>
                </Card>
              ))
            )}
          </Reveal>
        )}

        {tab === "evaluations" && (
          <Reveal className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold">Évaluations après match</h3>
              <Button size="sm" variant="outline" onClick={() => setEvalOpen(true)}>
                <Plus className="h-4 w-4" /> Évaluer
              </Button>
            </div>
            {evaluations.length === 0 ? (
              <p className="text-sm text-muted">Aucune évaluation pour le moment.</p>
            ) : (
              evaluations.map((e) => (
                <Card key={e.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{e.parPseudo}</p>
                    <span className="text-xs text-muted">{tempsRelatif(e.date)}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="mb-1 text-muted">Fair-play</p>
                      <StarRating value={e.fairPlay} readOnly />
                    </div>
                    <div>
                      <p className="mb-1 text-muted">Ponctualité</p>
                      <StarRating value={e.ponctualite} readOnly />
                    </div>
                    <div>
                      <p className="mb-1 text-muted">Niveau</p>
                      <StarRating value={e.niveau} readOnly />
                    </div>
                  </div>
                  {e.commentaire && <p className="mt-2 text-sm text-muted">&ldquo;{e.commentaire}&rdquo;</p>}
                </Card>
              ))
            )}
          </Reveal>
        )}
      </div>

      <EvaluationModal open={evalOpen} onClose={() => setEvalOpen(false)} onSubmit={addEvaluation} />
    </div>
  );
}

function MiniStat({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-2.5 text-center">
      <StatCounter value={value} suffix={suffix} className="text-lg font-bold" />
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function EvaluationModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: Omit<Evaluation, "id" | "date">) => void;
}) {
  const [fairPlay, setFairPlay] = useState(5);
  const [ponctualite, setPonctualite] = useState(5);
  const [niveau, setNiveau] = useState(5);
  const [commentaire, setCommentaire] = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Évaluer ce joueur">
      <div className="space-y-4">
        <RatingRow label="Fair-play" value={fairPlay} onChange={setFairPlay} />
        <RatingRow label="Ponctualité" value={ponctualite} onChange={setPonctualite} />
        <RatingRow label="Niveau de jeu" value={niveau} onChange={setNiveau} />
        <textarea
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder="Commentaire (optionnel)"
          rows={3}
          className="w-full resize-none rounded-xl border border-surface-border bg-surface-2 p-3 text-sm placeholder:text-muted focus:border-accent/40 focus:outline-none"
        />
        <Button
          className="w-full"
          onClick={() =>
            onSubmit({ parId: "moi", parPseudo: "VousMeme", fairPlay, ponctualite, niveau, commentaire })
          }
        >
          Envoyer l&apos;évaluation
        </Button>
      </div>
    </Modal>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <StarRating value={value} onChange={onChange} size="md" />
    </div>
  );
}
