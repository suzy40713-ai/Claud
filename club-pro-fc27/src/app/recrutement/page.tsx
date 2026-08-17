"use client";

import { useMemo, useState } from "react";
import { Bell, BellRing, ListFilter, SlidersHorizontal } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import Tabs from "@/components/ui/Tabs";
import AnnonceCard from "@/components/recrutement/AnnonceCard";
import EssaiModal from "@/components/recrutement/EssaiModal";
import { annonces, transferts } from "@/lib/mock-data";
import { LANGUES, POSTE_LABELS, POSTES, REGIONS } from "@/lib/constants";
import { tempsRelatif, cn } from "@/lib/utils";
import type { AnnonceRecrutement, Langue, Poste, Region } from "@/types";

const TYPE_OPTIONS = [
  { id: "tous", label: "Toutes les annonces" },
  { id: "club", label: "Clubs recrutent" },
  { id: "joueur", label: "Joueurs libres" },
];

export default function RecrutementPage() {
  const [tab, setTab] = useState("annonces");
  const [type, setType] = useState<"tous" | "club" | "joueur">("tous");
  const [poste, setPoste] = useState<Poste | "tous">("tous");
  const [region, setRegion] = useState<Region | "tous">("tous");
  const [langue, setLangue] = useState<Langue | "tous">("tous");
  const [niveauMin, setNiveauMin] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [alertes, setAlertes] = useState(false);
  const [essaiCible, setEssaiCible] = useState<AnnonceRecrutement | null>(null);

  const filtered = useMemo(() => {
    return annonces.filter((a) => {
      if (type !== "tous" && a.type !== type) return false;
      if (poste !== "tous" && a.poste !== poste) return false;
      if (region !== "tous" && a.region !== region) return false;
      if (langue !== "tous" && !a.langues.includes(langue)) return false;
      if (a.niveauMin < niveauMin) return false;
      return true;
    });
  }, [type, poste, region, langue, niveauMin]);

  return (
    <div>
      <div className="glass sticky top-0 z-30 border-b border-surface-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg font-bold">Recrutement</h1>
          <button
            onClick={() => setAlertes((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
              alertes ? "border-accent/40 bg-accent/10 text-accent" : "border-surface-border text-muted hover:text-foreground"
            )}
          >
            {alertes ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
            Alertes {alertes ? "activées" : "désactivées"}
          </button>
        </div>
      </div>

      <Tabs
        className="rec-tabs px-4"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "annonces", label: "Annonces", count: annonces.length },
          { id: "mercato", label: "Mercato" },
        ]}
      />

      {tab === "annonces" && (
        <div className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {TYPE_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => setType(o.id as typeof type)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  type === o.id
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-surface-border text-muted hover:text-foreground"
                )}
              >
                {o.label}
              </button>
            ))}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "ml-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold cursor-pointer",
                showFilters ? "border-white/25 bg-white/10" : "border-surface-border text-muted hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filtres
            </button>
          </div>

          {showFilters && (
            <Reveal y={-8}>
              <Card className="mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs text-muted">Poste</label>
                  <select
                    value={poste}
                    onChange={(e) => setPoste(e.target.value as Poste | "tous")}
                    className="w-full rounded-lg border border-surface-border bg-surface-2 p-2 text-sm focus:outline-none"
                  >
                    <option value="tous">Tous les postes</option>
                    {POSTES.map((p) => (
                      <option key={p} value={p}>{POSTE_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Région</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as Region | "tous")}
                    className="w-full rounded-lg border border-surface-border bg-surface-2 p-2 text-sm focus:outline-none"
                  >
                    <option value="tous">Toutes régions</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Langue</label>
                  <select
                    value={langue}
                    onChange={(e) => setLangue(e.target.value as Langue | "tous")}
                    className="w-full rounded-lg border border-surface-border bg-surface-2 p-2 text-sm focus:outline-none"
                  >
                    <option value="tous">Toutes langues</option>
                    {LANGUES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Niveau min. {niveauMin}</label>
                  <input
                    type="range"
                    min={0}
                    max={95}
                    step={5}
                    value={niveauMin}
                    onChange={(e) => setNiveauMin(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>
              </Card>
            </Reveal>
          )}

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-muted">
                <ListFilter className="h-8 w-8" />
                <p className="text-sm">Aucune annonce ne correspond à vos filtres.</p>
              </div>
            ) : (
              filtered.map((a, i) => (
                <AnnonceCard key={a.id} annonce={a} delay={i * 0.04} onOrganiserEssai={setEssaiCible} />
              ))
            )}
          </div>
        </div>
      )}

      {tab === "mercato" && (
        <div className="space-y-2 p-4">
          {transferts.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.05}>
              <Card className="flex items-center gap-3 p-3">
                <Avatar type="joueur" nom={t.joueurNom} seed={t.joueurAvatar} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-semibold">{t.joueurNom}</span>{" "}
                    <span className="text-muted">
                      {t.clubDepartNom ? `quitte ${t.clubDepartNom} pour` : "rejoint librement"}
                    </span>{" "}
                    <span className="font-semibold">{t.clubArriveeNom}</span>
                  </p>
                  <p className="text-xs text-muted">{POSTE_LABELS[t.poste]} · {t.type} · {tempsRelatif(t.date)}</p>
                </div>
                <Avatar type="club" nom={t.clubArriveeNom} seed={t.clubArriveeLogo} size="sm" />
              </Card>
            </Reveal>
          ))}
        </div>
      )}

      <EssaiModal annonce={essaiCible} onClose={() => setEssaiCible(null)} />
    </div>
  );
}
