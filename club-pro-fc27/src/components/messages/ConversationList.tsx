"use client";

import { Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { conversations } from "@/lib/mock-data";
import { tempsRelatif } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ConversationList({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="divide-y divide-surface-border">
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={cn(
            "flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/5 cursor-pointer",
            activeId === c.id && "bg-white/5"
          )}
        >
          <div className="relative shrink-0">
            <Avatar type={c.type === "groupe" ? "club" : "joueur"} nom={c.nom} seed={c.avatar} size="md" />
            {c.enLigne && (
              <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {c.type === "groupe" && <Users className="h-3 w-3 shrink-0 text-muted" />}
              <p className="truncate text-sm font-semibold">{c.nom}</p>
            </div>
            <p className="truncate text-xs text-muted">{c.dernierMessage}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[11px] text-muted">{tempsRelatif(c.dateDernierMessage)}</span>
            {c.nonLu > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#04150c]">
                {c.nonLu}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
