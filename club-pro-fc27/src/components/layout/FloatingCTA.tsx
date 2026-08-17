"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export default function FloatingCTA() {
  const pathname = usePathname();
  if (pathname.startsWith("/african-fc")) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      className="fixed right-4 bottom-20 z-40 lg:hidden"
    >
      <Link href="/african-fc#postuler">
        <motion.span
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="animate-pulse-cta flex items-center gap-2 rounded-full bg-gradient-to-r from-gold to-amber-400 px-4 py-3 text-sm font-bold text-[#241a02] shadow-xl"
        >
          <Flame className="h-4 w-4" />
          <span className="hidden sm:inline">Postuler à African FC</span>
          <span className="sm:hidden">Postuler</span>
        </motion.span>
      </Link>
    </motion.div>
  );
}
