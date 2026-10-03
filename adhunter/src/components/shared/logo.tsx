import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("h-7 w-7", className)}>
      <rect width="64" height="64" rx="14" fill="#171A21" />
      <rect x="1" y="1" width="62" height="62" rx="13" fill="none" stroke="#7657FF" strokeOpacity=".55" />
      <circle cx="28" cy="28" r="12" fill="none" stroke="#7657FF" strokeWidth="5" />
      <path d="M37 37l11 11" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="28" cy="28" r="3.5" fill="#fff" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)} aria-label="AdHunter — accueil">
      <LogoMark />
      <span className="text-[15px]">AdHunter</span>
    </Link>
  );
}
