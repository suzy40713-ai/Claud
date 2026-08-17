"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Send, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { conversations, messagesParConversation } from "@/lib/mock-data";
import type { MessagePrive } from "@/types";
import { cn } from "@/lib/utils";

export default function ThreadView({ id, onBack }: { id: string; onBack?: () => void }) {
  const conv = conversations.find((c) => c.id === id);
  const [messages, setMessages] = useState<MessagePrive[]>(() => messagesParConversation[id] ?? []);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!conv) return null;

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        conversationId: id,
        expediteur: "moi",
        contenu: input.trim(),
        date: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        moi: true,
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-surface-border p-3">
        <button onClick={onBack} className="rounded-full p-1.5 hover:bg-white/10 lg:hidden cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar type={conv.type === "groupe" ? "club" : "joueur"} nom={conv.nom} seed={conv.avatar} size="sm" />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
            {conv.type === "groupe" && <Users className="h-3.5 w-3.5 text-muted" />}
            {conv.nom}
          </p>
          <p className="text-xs text-muted">{conv.enLigne ? "En ligne" : "Hors ligne"}</p>
        </div>
      </div>

      <div ref={listRef} className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", m.moi ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                  m.moi ? "bg-accent text-[#04150c] rounded-br-sm" : "bg-surface-2 rounded-bl-sm"
                )}
              >
                {!m.moi && conv.type === "groupe" && (
                  <p className="mb-0.5 text-[11px] font-semibold opacity-70">{m.expediteur}</p>
                )}
                <p>{m.contenu}</p>
                <p className={cn("mt-1 text-[10px]", m.moi ? "text-[#04150c]/60" : "text-muted")}>{m.date}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 border-t border-surface-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Écrire un message..."
          className="min-w-0 flex-1 rounded-full border border-surface-border bg-surface-2 px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/40 focus:outline-none"
        />
        <button onClick={send} className="shrink-0 rounded-full bg-accent p-2.5 text-[#04150c] cursor-pointer">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
