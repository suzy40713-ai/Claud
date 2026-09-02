import { motion } from "framer-motion";
import { formatEuros } from "../lib/rates";

export function ThresholdBar({
  label,
  current,
  threshold,
  thresholdMax,
}: {
  label: string;
  current: number;
  threshold: number;
  thresholdMax?: number;
}) {
  const ratio = Math.min(current / threshold, 1.15);
  const pct = Math.min(ratio * 100, 100);
  const overBase = current > threshold;
  const overMax = thresholdMax ? current > thresholdMax : false;

  const barColor = overMax ? "bg-red-500" : overBase ? "bg-amber-500" : ratio > 0.8 ? "bg-amber-400" : "bg-teal-500";

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-500">
          {formatEuros(current)} / {formatEuros(threshold)}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {overMax && <p className="mt-1 text-xs font-medium text-red-600">Seuil majore depasse — verifie tes obligations.</p>}
      {overBase && !overMax && <p className="mt-1 text-xs font-medium text-amber-600">Seuil de base depasse.</p>}
      {!overBase && ratio > 0.8 && <p className="mt-1 text-xs font-medium text-amber-600">Tu approches du seuil.</p>}
    </div>
  );
}
