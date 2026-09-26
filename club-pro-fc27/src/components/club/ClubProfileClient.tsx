"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Calendar,
  Flame,
  Lock,
  MapPin,
  MessageCircle,
  Trophy,
  UserPlus,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ArchetypeBadge from "@/components/ui/ArchetypeBadge";
import DivisionBadge from "@/components/ui/DivisionBadge";
import StatCounter from "@/components/ui/StatCounter";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import Reveal from "@/components/ui/Reveal";
import Confetti from "@/components/ui/Confetti";
import Modal from "@/components/ui/Modal";
import type { Club } from "@/types";
import { joueurParId } from "@/lib/mock-data";
import { POSTE_LABELS } from "@/lib/constants";
import { formatNombre } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ClubProfileClient({ club }: { club: Club }) {
  const [tab, setTab] = useState("apercu");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(club.followers);
  const [candidature, setCandidature] = useState<null | string>(null);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [celebrate, setCelebrate] = useState(false);

  const effectif = club.effectif.map((id) => joueurParId(id)).filter((j): j is NonNullable<typeof j> => Boolean(j));
  const totalMatchs = club.stats.victoires + club.stats.nuls + club.stats.defaites;
  const winRate = totalMatchs ? Math.round((club.stats.victoires / totalMatchs) * 100) : 0;

  const submitCandidature = () => {
    if (!candidature) return;
    setConfirmed((prev) => [...prev, candidature]);
    setCandidature(null);
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 100);
  };

  return (
    <div>
      <Confetti active={celebrate} />
      <div
        className="relative h-36 w-full sm:h-48"
        style={{ background: `linear-gradient(135deg, ${club.couleurPrincipale}66, #06080a)` }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {club.vitrine && (
          <Link
            href="/african-fc"
            className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-gold/90 px-3 py-1.5 text-xs font-bold text-[#241a02] shadow-lg"
          >
            <Flame className="h-3.5 w-3.5" /> Page vitrine
          </Link>
        )}
      </div>

      <div className="px-4">
        <div className="-mt-14 flex items-end justify-between sm:-mt-16">
          <Avatar type="club" nom={club.nom} seed={club.id} size="2xl" ring className="h-24 w-24 rounded-2xl text-3xl sm:h-32 sm:w-32" />
          <div className="flex gap-2 pb-2">
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4" /> Contacter
            </Button>
            <Button
              variant={following ? "outline" : "primary"}
              size="sm"
              onClick={() => {
                setFollowing((v) => !v);
                setFollowers((v) => (following ? v - 1 : v + 1));
              }}
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
          <h1 className="font-display text-2xl font-bold">{club.nom}</h1>
          {club.verifie && <BadgeCheck className="h-5 w-5 fill-accent text-background" />}
          <Badge tone="gray">#{club.tag}</Badge>
          <Badge tone="gold">
            <Trophy className="h-3 w-3" /> Rang #{club.classementRang}
          </Badge>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/90">{club.description}</p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {club.region}</span>
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Fondé en {club.fondation}</span>
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          <span><b>{formatNombre(followers)}</b> <span className="text-muted">abonnés</span></span>
          <span><b>{effectif.length}</b> <span className="text-muted">joueurs</span></span>
        </div>

        <Card className="my-4 grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <MiniStat label="ELO" value={club.classementElo} />
          <MiniStat label="Victoires" value={club.stats.victoires} />
          <MiniStat label="Taux de victoire" value={winRate} suffix="%" />
          <MiniStat label="Buts marqués" value={club.stats.butsMarques} />
        </Card>
      </div>

      <Tabs
        className="club-tabs px-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "apercu", label: "Aperçu" },
          { id: "effectif", label: "Effectif", count: effectif.length },
          { id: "resultats", label: "Résultats" },
          { id: "recrutement", label: "Recrutement", count: club.posteRecherche.filter((p) => !p.pourvu).length },
        ]}
      />

      <div className="p-4">
        {tab === "apercu" && (
          <Reveal className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-3 font-display font-bold">Palmarès</h3>
              {club.palmares.length === 0 ? (
                <p className="text-sm text-muted">Pas encore de titre.</p>
              ) : (
                <ul className="space-y-2">
                  {club.palmares.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm">
                      <Trophy className="h-4 w-4 shrink-0 text-gold" /> {p}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Reveal>
        )}

        {tab === "effectif" && (
          <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {effectif.length === 0 ? (
              <p className="text-sm text-muted">Effectif non renseigné.</p>
            ) : (
              effectif.map((j) => (
                <Link key={j.id} href={`/joueur/${j.id}`}>
                  <Card className="flex items-center gap-3 p-3">
                    <Avatar type="joueur" nom={j.pseudo} seed={j.id} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{j.pseudo}</p>
                      <p className="truncate text-xs text-muted">{POSTE_LABELS[j.poste]}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <ArchetypeBadge archetype={j.archetype} size="sm" />
                        <DivisionBadge division={j.division} size="sm" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </Reveal>
        )}

        {tab === "resultats" && (
          <Reveal className="space-y-2">
            {club.resultats.length === 0 ? (
              <p className="text-sm text-muted">Aucun résultat récent.</p>
            ) : (
              club.resultats.map((r) => (
                <Card key={r.id} className="flex items-center gap-3 p-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      r.resultat === "Victoire" && "bg-accent/15 text-accent",
                      r.resultat === "Défaite" && "bg-danger/15 text-red-400",
                      r.resultat === "Nul" && "bg-white/10 text-muted"
                    )}
                  >
                    {r.resultat[0]}
                  </span>
                  <Avatar type="club" nom={r.adversaireNom} seed={r.adversaireId} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">vs {r.adversaireNom}</p>
                    <p className="text-xs text-muted">{r.competition}</p>
                  </div>
                  <span className="font-display text-lg font-bold">
                    {r.score} - {r.scoreAdversaire}
                  </span>
                </Card>
              ))
            )}
          </Reveal>
        )}

        {tab === "recrutement" && (
          <Reveal className="space-y-3">
            {club.posteRecherche.length === 0 ? (
              <p className="text-sm text-muted">Aucun poste ouvert actuellement.</p>
            ) : (
              club.posteRecherche.map((p, i) => {
                const already = confirmed.includes(`${p.poste}-${i}`);
                return (
                  <Card key={`${p.poste}-${i}`} className={cn("p-4", p.pourvu && "opacity-60")}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold">{POSTE_LABELS[p.poste]}</span>
                          {p.archetype && <ArchetypeBadge archetype={p.archetype} size="sm" />}
                        </div>
                        <p className="mt-1 text-xs text-muted">Niveau minimum requis : {p.niveauMin}</p>
                      </div>
                      {p.pourvu ? (
                        <Badge tone="gray"><Lock className="h-3 w-3" /> Complet</Badge>
                      ) : already ? (
                        <Badge tone="green">Candidature envoyée</Badge>
                      ) : (
                        <Button size="sm" variant="gold" onClick={() => setCandidature(`${p.poste}-${i}`)}>
                          Postuler
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </Reveal>
        )}
      </div>

      <Modal open={!!candidature} onClose={() => setCandidature(null)} title="Confirmer la candidature">
        <p className="mb-4 text-sm text-muted">
          Votre profil sera envoyé à {club.nom} pour ce poste. Le club pourra vous contacter par message privé.
        </p>
        <Button className="w-full" onClick={submitCandidature}>
          Confirmer ma candidature
        </Button>
      </Modal>
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
