import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-accent-light";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

export function scoreRingColor(score: number) {
  if (score >= 80) return "stroke-emerald-400";
  if (score >= 60) return "stroke-accent-light";
  if (score >= 40) return "stroke-amber-400";
  return "stroke-red-400";
}
