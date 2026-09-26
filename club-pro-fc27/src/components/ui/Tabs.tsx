"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar flex gap-1 overflow-x-auto border-b border-surface-border", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative shrink-0 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer",
            active === tab.id ? "text-foreground" : "text-muted hover:text-foreground"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs text-muted">{tab.count}</span>
          )}
          {active === tab.id && (
            <motion.div
              layoutId={`tab-underline-${className}`}
              className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
