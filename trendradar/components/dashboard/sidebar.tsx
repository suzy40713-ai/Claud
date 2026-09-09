"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Générer des idées", icon: "🔎" },
  { href: "/dashboard/analyze", label: "Analyser une idée", icon: "🧪" },
  { href: "/dashboard/radar", label: "Radar", icon: "📡" },
  { href: "/dashboard/calendar", label: "Calendrier", icon: "📅" },
  { href: "/dashboard/saved", label: "Sauvegardées", icon: "⭐" },
  { href: "/dashboard/settings", label: "Réglages & facturation", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-surface p-4 md:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2 text-lg font-bold">
        <span className="text-accent-light">◈</span> TrendRadar
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-accent-gradient text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          ↩ Déconnexion
        </button>
      </form>
    </aside>
  );
}
