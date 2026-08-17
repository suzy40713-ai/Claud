"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { stories } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function StoriesRow() {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto border-b border-surface-border p-4">
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <button className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-white/20 text-muted hover:border-accent/50 hover:text-accent cursor-pointer">
          <Plus className="h-5 w-5" />
        </button>
        <span className="text-[11px] text-muted">Ta story</span>
      </div>
      {stories.map((s, i) => (
        <motion.button
          key={s.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          whileTap={{ scale: 0.94 }}
          className="flex shrink-0 flex-col items-center gap-1.5"
        >
          <div
            className={cn(
              "rounded-full p-[2px]",
              !s.vue && "bg-gradient-to-br"
            )}
            style={
              !s.vue
                ? { backgroundImage: `linear-gradient(135deg, ${s.couleur}, #f2c14e)` }
                : { backgroundColor: "rgba(255,255,255,0.12)" }
            }
          >
            <div className="rounded-full bg-background p-[2px]">
              <Avatar type={s.auteurId === "african-fc" || s.auteurId.startsWith("c") ? "club" : "joueur"} nom={s.auteurNom} seed={s.auteurAvatar} size="lg" />
            </div>
          </div>
          <span className="max-w-[60px] truncate text-[11px] text-muted">{s.auteurNom}</span>
        </motion.button>
      ))}
    </div>
  );
}
