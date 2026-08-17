"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BOTTOM_NAV_LINKS } from "@/lib/constants";
import DynamicIcon from "@/components/ui/DynamicIcon";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass sticky bottom-0 z-40 flex items-center justify-around border-t border-surface-border px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden">
      {BOTTOM_NAV_LINKS.map((link) => {
        const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium"
          >
            {active && (
              <motion.div
                layoutId="bottomnav-active"
                className="absolute inset-x-3 inset-y-0.5 rounded-lg bg-white/8"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <DynamicIcon
              name={link.icon}
              className={cn("relative z-10 h-5 w-5", active ? "text-accent" : "text-muted")}
            />
            <span className={cn("relative z-10", active ? "text-foreground" : "text-muted")}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
