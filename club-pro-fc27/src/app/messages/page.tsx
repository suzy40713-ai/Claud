"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import ConversationList from "@/components/messages/ConversationList";
import ThreadView from "@/components/messages/ThreadView";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100dvh-7rem)] lg:h-dvh">
      <div
        className={cn(
          "h-full w-full shrink-0 overflow-y-auto border-r border-surface-border lg:block lg:w-80",
          activeId ? "hidden lg:block" : "block"
        )}
      >
        <div className="border-b border-surface-border p-4">
          <h1 className="font-display text-lg font-bold">Messages</h1>
        </div>
        <ConversationList activeId={activeId} onSelect={setActiveId} />
      </div>

      <div className={cn("h-full min-w-0 flex-1", activeId ? "block" : "hidden lg:block")}>
        {activeId ? (
          <ThreadView key={activeId} id={activeId} onBack={() => setActiveId(null)} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
            <MessageCircle className="h-10 w-10" />
            <p className="text-sm">Sélectionnez une conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
