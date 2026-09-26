"use client";

import { Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  ["#17e58a", "#0f9d58"],
  ["#f2c14e", "#b8902f"],
  ["#22d3ee", "#0e7490"],
  ["#a78bfa", "#6d28d9"],
  ["#fb7185", "#9f1239"],
  ["#38bdf8", "#1d4ed8"],
  ["#fbbf24", "#c2410c"],
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function initiales(nom: string): string {
  const parts = nom.replace(/[_-]/g, " ").split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

const SIZES = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-xs",
  lg: "h-14 w-14 text-sm",
  xl: "h-20 w-20 text-lg",
  "2xl": "h-28 w-28 text-2xl",
};

interface AvatarProps {
  seed?: string;
  nom: string;
  type: "joueur" | "club";
  size?: keyof typeof SIZES;
  className?: string;
  ring?: boolean;
}

export default function Avatar({ seed, nom, type, size = "md", className, ring }: AvatarProps) {
  const effectiveSeed = seed || nom;
  const hasIdentity = Boolean(seed);
  const [from, to] = hasIdentity
    ? GRADIENTS[hash(effectiveSeed) % GRADIENTS.length]
    : ["#3a4149", "#20242a"];

  const shape = type === "club" ? "rounded-xl" : "rounded-full";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center font-display font-bold select-none overflow-hidden",
        shape,
        SIZES[size],
        ring && "ring-2 ring-background outline outline-2 outline-surface-border",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      title={nom}
    >
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "6px 6px",
        }}
      />
      {hasIdentity ? (
        <span className="relative z-10 text-white drop-shadow-sm tracking-wide">
          {initiales(nom)}
        </span>
      ) : type === "club" ? (
        <Shield className="relative z-10 h-1/2 w-1/2 text-white/70" strokeWidth={1.5} />
      ) : (
        <User className="relative z-10 h-1/2 w-1/2 text-white/70" strokeWidth={1.5} />
      )}
    </div>
  );
}
