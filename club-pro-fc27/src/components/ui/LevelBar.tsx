"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LevelBar({
  niveau,
  niveauMax = 100,
  label = "Niveau du Pro",
  className,
}: {
  niveau: number;
  niveauMax?: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.round((niveau / niveauMax) * 100));

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="font-display text-sm font-bold text-foreground">
          {niveau}
          <span className="text-muted font-normal">/{niveauMax}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-accent-dim to-accent"
        />
      </div>
    </div>
  );
}
