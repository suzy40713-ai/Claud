"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Flag, Save, ShieldCheck, UserCheck } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";
import PhotoUpload from "@/components/ui/PhotoUpload";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { LANGUES, POSTES, POSTE_LABELS, REGIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Langue, Poste, Region, StatutJoueur } from "@/types";

export default function ParametresPage() {
  const [tab, setTab] = useState("profil");
  const [accountType, setAccountType] = useState<"joueur" | "club">("joueur");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState("VousMeme");
  const [bio, setBio] = useState("Nouveau sur Club Pro FC 27. Prêt à faire mes preuves !");
  const [poste, setPoste] = useState<Poste>("MOC");
  const [region, setRegion] = useState<Region>("France");
  const [statut, setStatut] = useState<StatutJoueur>("Libre");
  const [langues, setLangues] = useState<Langue[]>(["Français"]);
  const [saved, setSaved] = useState(false);

  const [notifMatch, setNotifMatch] = useState(true);
  const [notifMessage, setNotifMessage] = useState(true);
  const [notifRecrutement, setNotifRecrutement] = useState(true);
  const [notifLive, setNotifLive] = useState(false);

  const [verifOuvert, setVerifOuvert] = useState(false);
  const [verifie, setVerifie] = useState(false);
  const [signalOuvert, setSignalOuvert] = useState(false);

  const toggleLangue = (l: Langue) => {
    setLangues((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 font-display text-xl font-bold">Paramètres</h1>

      <Tabs
        className="settings-tabs"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "profil", label: "Profil" },
          { id: "notifications", label: "Notifications" },
          { id: "securite", label: "Sécurité" },
        ]}
      />

      <div className="py-5">
        {tab === "profil" && (
          <div className="space-y-6">
            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold">Type de compte</p>
              <div className="mb-5 grid grid-cols-2 gap-2">
                {(["joueur", "club"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAccountType(t)}
                    className={cn(
                      "rounded-xl border py-2.5 text-sm font-semibold capitalize transition-colors cursor-pointer",
                      accountType === t
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-surface-border text-muted hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <PhotoUpload
                accountType={accountType}
                nom={pseudo}
                currentSeed="moi"
                onConfirm={(url) => setAvatarUrl(url)}
              />
              {avatarUrl && (
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-accent">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Photo prête à être enregistrée
                </p>
              )}
            </Card>

            <Card className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Pseudo</label>
                <input
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  className="w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:border-accent/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:border-accent/40 focus:outline-none"
                />
              </div>

              {accountType === "joueur" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Poste préféré</label>
                      <select
                        value={poste}
                        onChange={(e) => setPoste(e.target.value as Poste)}
                        className="w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:outline-none"
                      >
                        {POSTES.map((p) => (
                          <option key={p} value={p}>{POSTE_LABELS[p]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted">Statut</label>
                      <select
                        value={statut}
                        onChange={(e) => setStatut(e.target.value as StatutJoueur)}
                        className="w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:outline-none"
                      >
                        {(["Libre", "En club", "En essai"] as const).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Région</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region)}
                  className="w-full rounded-xl border border-surface-border bg-surface-2 p-2.5 text-sm focus:outline-none"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-muted">Langues parlées</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUES.map((l) => (
                    <button
                      key={l}
                      onClick={() => toggleLangue(l)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                        langues.includes(l)
                          ? "border-accent/40 bg-accent/10 text-accent"
                          : "border-surface-border text-muted hover:text-foreground"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <div className="flex items-center gap-3">
              <Button size="lg" onClick={save}>
                <Save className="h-4 w-4" /> Enregistrer
              </Button>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-sm text-accent"
                >
                  <CheckCircle2 className="h-4 w-4" /> Profil mis à jour
                </motion.span>
              )}
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <Card className="divide-y divide-surface-border p-0">
            {[
              { label: "Résultats de matchs", desc: "Score et résumé après chaque match", value: notifMatch, set: setNotifMatch },
              { label: "Messages privés", desc: "Nouveaux messages et mentions", value: notifMessage, set: setNotifMessage },
              { label: "Recrutement", desc: "Nouvelles offres correspondant à votre profil", value: notifRecrutement, set: setNotifRecrutement },
              { label: "Diffusions live", desc: "Quand un club que vous suivez passe en direct", value: notifLive, set: setNotifLive },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-semibold">{n.label}</p>
                  <p className="text-xs text-muted">{n.desc}</p>
                </div>
                <button
                  onClick={() => n.set(!n.value)}
                  className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer", n.value ? "bg-accent" : "bg-white/15")}
                >
                  <motion.span
                    animate={{ x: n.value ? 20 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-1 h-4 w-4 rounded-full bg-white"
                  />
                </button>
              </div>
            ))}
          </Card>
        )}

        {tab === "securite" && (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-8 w-8 text-accent" />
                  <div>
                    <p className="text-sm font-semibold">Vérification d&apos;identité</p>
                    <p className="text-xs text-muted">Limitez les faux profils et gagnez un badge vérifié</p>
                  </div>
                </div>
                {verifie ? (
                  <Badge tone="green">Vérifié</Badge>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setVerifOuvert(true)}>
                    Vérifier
                  </Button>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flag className="h-8 w-8 text-red-400" />
                  <div>
                    <p className="text-sm font-semibold">Signaler un comportement</p>
                    <p className="text-xs text-muted">Toxicité, triche, faux profil...</p>
                  </div>
                </div>
                <Button size="sm" variant="danger" onClick={() => setSignalOuvert(true)}>
                  Signaler
                </Button>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-gold" />
                <div>
                  <p className="text-sm font-semibold">Modération communautaire</p>
                  <p className="text-xs text-muted">
                    Club Pro FC 27 s&apos;appuie sur une équipe de modérateurs et sur les signalements de la
                    communauté pour garantir un environnement sain.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Modal open={verifOuvert} onClose={() => setVerifOuvert(false)} title="Vérification d'identité">
        <p className="mb-4 text-sm text-muted">
          Confirmez votre identité pour obtenir le badge vérifié et rassurer les clubs et joueurs.
        </p>
        <Button
          className="w-full"
          onClick={() => {
            setVerifie(true);
            setVerifOuvert(false);
          }}
        >
          Lancer la vérification
        </Button>
      </Modal>

      <Modal open={signalOuvert} onClose={() => setSignalOuvert(false)} title="Signaler un profil ou contenu">
        <div className="space-y-2">
          {["Comportement toxique", "Faux profil", "Triche", "Spam / arnaque"].map((r) => (
            <button
              key={r}
              onClick={() => setSignalOuvert(false)}
              className="flex w-full items-center gap-2 rounded-xl border border-surface-border bg-surface-2 p-3 text-left text-sm hover:border-red-400/40 hover:bg-red-400/5 cursor-pointer"
            >
              <Flag className="h-4 w-4 text-red-400" /> {r}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
