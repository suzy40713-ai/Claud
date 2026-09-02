import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ACTIVITIES, computeCharges, formatEuros } from "../lib/rates";
import { currentMonthKey, currentYear, yearTotal, type CotizoData } from "../lib/storage";
import { ThresholdBar } from "./ThresholdBar";
import { HistoryChart } from "./HistoryChart";
import { Deadlines } from "./Deadlines";

export function Dashboard({
  data,
  onUpdate,
  onReset,
}: {
  data: CotizoData;
  onUpdate: (patch: Partial<CotizoData>) => void;
  onReset: () => void;
}) {
  const activity = data.activity!;
  const info = ACTIVITIES[activity];
  const [caInput, setCaInput] = useState("");
  const [saved, setSaved] = useState(false);

  const ca = Number(caInput.replace(",", ".")) || 0;
  const result = useMemo(() => computeCharges(activity, ca, data.versementLiberatoire), [activity, ca, data.versementLiberatoire]);

  const year = currentYear();
  const monthKey = currentMonthKey();
  const totalAnnee = yearTotal(data.entries, year);
  const totalAvecSaisie = totalAnnee - (data.entries.find((e) => e.month === monthKey)?.chiffreAffaires ?? 0) + ca;

  function handleSave() {
    if (ca <= 0) return;
    const others = data.entries.filter((e) => e.month !== monthKey);
    onUpdate({ entries: [...others, { month: monthKey, chiffreAffaires: ca }].sort((a, b) => a.month.localeCompare(b.month)) });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-8">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900">
          <span aria-hidden>🧾</span> Cotizo
        </span>
        <button onClick={onReset} className="text-xs font-medium text-slate-400 underline hover:text-slate-600">
          Changer d'activite / reinitialiser
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-teal-600">{info.label}</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">Calculateur de charges</h2>

        <label className="mt-4 block text-sm font-medium text-slate-600">Chiffre d'affaires encaisse ce mois-ci</label>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              inputMode="decimal"
              value={caInput}
              onChange={(e) => setCaInput(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-2xl font-bold text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
              €
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={ca <= 0}
            className="shrink-0 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-30"
          >
            {saved ? "Enregistre ✓" : "Enregistrer ce mois"}
          </button>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={data.versementLiberatoire}
            onChange={(e) => onUpdate({ versementLiberatoire: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          J'ai opte pour le versement liberatoire de l'impot sur le revenu (+{(info.versementLiberatoireRate * 100).toFixed(1)}%)
        </label>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ChargeStat label="Cotisations sociales" value={result.cotisationsSociales} />
          {data.versementLiberatoire && <ChargeStat label="Versement liberatoire" value={result.versementLiberatoire} />}
          <ChargeStat label="Total preleve" value={result.totalPreleve} accent />
          <ChargeStat label="Net pour toi" value={result.net} highlight />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold text-slate-900">Suivi des seuils {year}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Cumul de l'annee : <span className="font-semibold text-slate-700">{formatEuros(totalAvecSaisie)}</span>
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <ThresholdBar label="Franchise de TVA" current={totalAvecSaisie} threshold={info.seuilTvaBase} thresholdMax={info.seuilTvaMajore} />
          <ThresholdBar label="Plafond micro-entreprise" current={totalAvecSaisie} threshold={info.seuilMicro} />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-bold text-slate-900">Historique {year}</h2>
        <HistoryChart entries={data.entries} year={year} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Deadlines />
      </motion.div>

      <p className="flex items-start gap-2 pb-8 text-xs text-slate-400">
        <span aria-hidden>🔒</span>
        Tes chiffres restent stockes uniquement sur cet appareil (localStorage du navigateur). Rien n'est envoye a un
        serveur. Cotizo donne une estimation basee sur le bareme officiel URSSAF — verifie toujours les montants
        exacts sur ton espace autoentrepreneur.urssaf.fr avant declaration.
      </p>
    </div>
  );
}

function ChargeStat({ label, value, accent, highlight }: { label: string; value: number; accent?: boolean; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl p-3 ${highlight ? "bg-gradient-cotizo-soft" : "bg-slate-50"}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${highlight ? "text-gradient-cotizo" : accent ? "text-slate-900" : "text-slate-700"}`}>
        {formatEuros(value)}
      </p>
    </div>
  );
}
