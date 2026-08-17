"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { chatMessages } from "@/lib/mock-data";
import type { ChatMessage } from "@/types";

const POOL = [
  "ALLEZ !!! 🔥",
  "quel match",
  "GOAL 😱",
  "il fallait la mettre là",
  "top niveau ce soir",
  "African FC en feu",
  "le gardien est solide",
  "on tient le score les gars",
  "🔥🔥🔥",
  "belle passe décisive",
];
const NAMES = ["FanAFC_22", "ProWatcher", "TifoNord", "ClubProFan", "Viewer_44", "SekouFan"];

export default function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const msg: ChatMessage = {
        id: `auto-${Date.now()}`,
        auteur: NAMES[Math.floor(Math.random() * NAMES.length)],
        avatar: `auto-${Math.random()}`,
        message: POOL[Math.floor(Math.random() * POOL.length)],
        date: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev.slice(-30), msg]);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `me-${Date.now()}`, auteur: "VousMeme", avatar: "moi", message: input.trim(), date: "maintenant", couleur: "#17e58a" },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={listRef} className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto p-3">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-2 text-sm"
            >
              <Avatar type="joueur" nom={m.auteur} seed={m.avatar} size="xs" />
              <p className="min-w-0 leading-snug break-words">
                <span className="font-semibold" style={{ color: m.couleur }}>
                  {m.auteur}
                </span>{" "}
                <span className="text-foreground/85">{m.message}</span>
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-2 border-t border-surface-border p-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Envoyer un message..."
          className="min-w-0 flex-1 rounded-full border border-surface-border bg-surface-2 px-3 py-2 text-sm placeholder:text-muted focus:border-accent/40 focus:outline-none"
        />
        <button onClick={send} className="shrink-0 rounded-full bg-accent p-2 text-[#04150c] cursor-pointer">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
