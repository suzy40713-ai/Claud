import { useState } from "react";
import { Link } from "react-router";
import type { Niveau, Objectif, Sport } from "@sports-coach/shared";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { PushAlertToggle } from "../training-plan/PushAlertToggle";

const SPORT_OPTIONS: { value: Sport; label: string; icon: string }[] = [
  { value: "course_a_pied", label: "Course a pied", icon: "🏃" },
  { value: "velo", label: "Velo", icon: "🚴" },
];

const NIVEAU_OPTIONS: { value: Niveau; label: string; icon: string }[] = [
  { value: "debutant", label: "Debutant", icon: "🌱" },
  { value: "intermediaire", label: "Intermediaire", icon: "🔥" },
  { value: "avance", label: "Avance", icon: "🏆" },
];

const OBJECTIF_OPTIONS: { value: Objectif; label: string; icon: string }[] = [
  { value: "perte_de_poids", label: "Perte de poids", icon: "⚖️" },
  { value: "preparation_course", label: "Preparation d'une course", icon: "🏁" },
  { value: "regularite", label: "Regularite / reprise en douceur", icon: "🔄" },
  { value: "performance", label: "Performance / battre mon record", icon: "🚀" },
];

export function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const [sports, setSports] = useState<Sport[]>(user?.sportsPratiques ?? []);
  const [niveau, setNiveau] = useState<Niveau | null>(user?.niveau ?? null);
  const [objectif, setObjectif] = useState<Objectif | null>(user?.objectif ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  function toggleSport(sport: Sport) {
    setSaved(false);
    setSports((prev) => (prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]));
  }

  async function handleSave() {
    if (!niveau || !objectif || sports.length === 0) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await api.submitOnboarding({ sportsPratiques: sports, niveau, objectif, injuries: [] });
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer tes modifications");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">⚙️ Parametres</h1>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Ton profil</h2>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-600">Sport(s) pratique(s)</p>
          <div className="flex flex-col gap-2">
            {SPORT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  sports.includes(opt.value) ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span aria-hidden className="text-xl">
                  {opt.icon}
                </span>
                <input type="checkbox" checked={sports.includes(opt.value)} onChange={() => toggleSport(opt.value)} />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-600">Niveau</p>
          <div className="flex flex-col gap-2">
            {NIVEAU_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  niveau === opt.value ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span aria-hidden className="text-xl">
                  {opt.icon}
                </span>
                <input
                  type="radio"
                  name="niveau"
                  checked={niveau === opt.value}
                  onChange={() => {
                    setSaved(false);
                    setNiveau(opt.value);
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-600">Objectif principal</p>
          <div className="flex flex-col gap-2">
            {OBJECTIF_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  objectif === opt.value ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span aria-hidden className="text-xl">
                  {opt.icon}
                </span>
                <input
                  type="radio"
                  name="objectif"
                  checked={objectif === opt.value}
                  onChange={() => {
                    setSaved(false);
                    setObjectif(opt.value);
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600">Modifications enregistrees.</p>}
        <Button disabled={busy || !niveau || !objectif || sports.length === 0} onClick={handleSave} className="self-start">
          {busy ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
        <PushAlertToggle />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Compte</h2>
        <p className="text-sm text-slate-600">
          Connectee avec <span className="font-semibold text-slate-900">{user.email}</span>
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link to="/confidentialite" className="font-semibold text-indigo-600">
            Politique de confidentialite
          </Link>
          <a
            href={`${import.meta.env.BASE_URL}suppression-compte.html`}
            className="font-semibold text-indigo-600"
          >
            Supprimer mon compte
          </a>
        </div>
        <Button variant="secondary" onClick={() => logout()} className="mt-2 self-start">
          Se deconnecter
        </Button>
      </section>
    </div>
  );
}
