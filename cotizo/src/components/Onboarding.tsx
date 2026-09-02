import { motion } from "framer-motion";
import { ACTIVITIES, RATES_UPDATED_AT, type ActivityType } from "../lib/rates";

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  vente: "🛍️",
  service_bic: "🛠️",
  liberal_cipav: "🎓",
  liberal_bnc: "💼",
};

export function Onboarding({ onSelect }: { onSelect: (activity: ActivityType) => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <span className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <span aria-hidden>🧾</span> Cotizo
        </span>
        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Tes charges <span className="text-gradient-cotizo">calculees en 2 secondes</span>
        </h1>
        <p className="mt-4 max-w-lg text-lg text-slate-600">
          Combien te reste-t-il vraiment apres l'URSSAF ? Es-tu proche d'un seuil ? Cotizo repond instantanement,
          sans creer de compte et sans envoyer tes chiffres nulle part.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {(Object.entries(ACTIVITIES) as [ActivityType, (typeof ACTIVITIES)[ActivityType]][]).map(([key, info]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
          >
            <span className="text-3xl" aria-hidden>
              {ACTIVITY_ICONS[key]}
            </span>
            <span className="font-bold text-slate-900">{info.label}</span>
            <span className="text-sm text-slate-500">{(info.cotisationRate * 100).toFixed(1)}% de cotisations</span>
          </button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-12 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/70 p-5 text-sm text-slate-500"
      >
        <p className="flex items-start gap-2">
          <span aria-hidden>🔒</span>
          <span>
            Tes chiffres restent sur ton appareil (stockage local du navigateur) — rien n'est envoye ni stocke sur un
            serveur.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <span aria-hidden>📋</span>
          <span>
            Taux et seuils bases sur le bareme officiel URSSAF, verifies le {formatDate(RATES_UPDATED_AT)}. Ils
            changent chaque annee : verifie toujours{" "}
            <a
              className="font-semibold text-teal-700 underline"
              href="https://www.autoentrepreneur.urssaf.fr"
              target="_blank"
              rel="noreferrer"
            >
              autoentrepreneur.urssaf.fr
            </a>{" "}
            avant une decision importante.
          </span>
        </p>
      </motion.div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
