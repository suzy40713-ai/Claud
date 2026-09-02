import { motion } from "framer-motion";
import { STRIPE_PAYMENT_LINK } from "../lib/pro";

export function UpgradeCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-cotizo p-6 text-white shadow-sm"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-white/80">Cotizo Pro</p>
      <h2 className="mt-1 text-lg font-bold">Debloque l'export et l'historique complet</h2>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm text-white/90">
        <li className="flex items-center gap-2">
          <span aria-hidden>📄</span> Export PDF du recapitulatif annuel (pour ta compta)
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden>📅</span> Historique illimite (toutes les annees, pas seulement l'annee en cours)
        </li>
      </ul>
      <a
        href={STRIPE_PAYMENT_LINK}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-transform hover:scale-[1.02]"
      >
        Passer Pro — 19,99€ (achat unique) →
      </a>
    </motion.div>
  );
}
