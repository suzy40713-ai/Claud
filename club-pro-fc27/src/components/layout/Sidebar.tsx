"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import DynamicIcon from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 flex-col overflow-y-auto border-r border-surface-border px-3 py-4 lg:flex">
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_LINKS.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/" && link.href !== "/joueur/moi" && pathname.startsWith(link.href));
          const isAfc = link.href === "/african-fc";
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-[#241a02]"
                  : isAfc
                    ? "text-gold/80 hover:text-gold"
                    : "text-muted hover:text-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold to-amber-400"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <DynamicIcon name={link.icon} className="relative z-10 h-5 w-5" />
              <span className="relative z-10">{link.label}</span>
              {isAfc && !active && <Flame className="relative z-10 ml-auto h-4 w-4 text-gold" />}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/african-fc#postuler"
        className="animate-pulse-cta mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold to-amber-400 px-4 py-2.5 text-sm font-bold text-[#241a02] shadow-lg transition-transform hover:scale-[1.02]"
      >
        <Flame className="h-4 w-4" />
        Postuler à African FC
      </Link>
    </aside>
  );
}
