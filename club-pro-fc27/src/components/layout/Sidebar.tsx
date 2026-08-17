"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Flame, Settings, Shield } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import DynamicIcon from "@/components/ui/DynamicIcon";
import Avatar from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-surface-border px-3 py-5 lg:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dim text-[#04150c]">
          <Shield className="h-5 w-5" fill="currentColor" strokeWidth={0} />
        </div>
        <span className="font-display text-lg font-bold tracking-tight">
          Club Pro <span className="text-gradient-accent">FC 27</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          const isAfc = link.href === "/african-fc";
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? isAfc
                    ? "text-gold"
                    : "text-foreground"
                  : "text-muted hover:text-foreground",
                isAfc && !active && "text-gold/80 hover:text-gold"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className={cn(
                    "absolute inset-0 rounded-xl",
                    isAfc ? "bg-gold/10 border border-gold/25" : "bg-white/7"
                  )}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <DynamicIcon
                name={link.icon}
                className={cn("relative z-10 h-5 w-5", isAfc && "fill-gold/20")}
              />
              <span className="relative z-10">{link.label}</span>
              {isAfc && <Flame className="relative z-10 ml-auto h-4 w-4 text-gold" />}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/african-fc#postuler"
        className="animate-pulse-cta mb-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-400 px-4 py-2.5 text-sm font-bold text-[#241a02] shadow-lg transition-transform hover:scale-[1.02]"
      >
        <Flame className="h-4 w-4" />
        Postuler à African FC
      </Link>

      <div className="flex items-center gap-2 rounded-xl border border-surface-border px-2 py-2">
        <Link href="/joueur/moi" className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar type="joueur" nom="VousMeme" seed="moi" size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">VousMeme</p>
            <p className="truncate text-xs text-muted">Voir mon profil</p>
          </div>
        </Link>
        <Link
          href="/parametres"
          className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
