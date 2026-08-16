import { motion } from "framer-motion";
import { Link } from "react-router";

export function EbookPromoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-slate-900 p-5 text-white shadow-lg shadow-slate-900/20"
    >
      <div className="animate-shimmer pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.10)_50%,transparent_65%)]" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-pink-400">Nouveau</p>
          <p className="mt-1 font-bold">Transformation 90 Jours</p>
          <p className="mt-0.5 text-sm text-slate-300">L'ebook complet, -40% aujourd'hui</p>
        </div>
        <Link
          to="/ebook"
          className="animate-pulse-glow shrink-0 rounded-full bg-gradient-kadence px-4 py-2 text-sm font-bold text-white"
        >
          Voir →
        </Link>
      </div>
    </motion.div>
  );
}

export function PremiumPromoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl border border-indigo-100 bg-gradient-kadence-soft p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">Premium</p>
          <p className="mt-1 font-bold text-slate-900">Coach IA illimite + Strava auto</p>
          <p className="mt-0.5 text-sm text-slate-600">Debloque tout ton potentiel</p>
        </div>
        <Link
          to="/abonnement"
          className="shrink-0 rounded-full border-2 border-indigo-600 px-4 py-2 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
        >
          Decouvrir
        </Link>
      </div>
    </motion.div>
  );
}
