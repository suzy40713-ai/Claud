"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Smile, Video } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";

export default function Composer({ onPost }: { onPost: (contenu: string) => void }) {
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onPost(text.trim());
    setText("");
  };

  return (
    <div className="border-b border-surface-border p-4">
      <div className="flex gap-3">
        <Avatar type="joueur" nom="VousMeme" seed="moi" size="md" />
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Quoi de neuf sur les terrains ?"
            rows={2}
            className="w-full resize-none bg-transparent text-[15px] placeholder:text-muted focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-accent">
              <button className="rounded-full p-2 hover:bg-accent/10 cursor-pointer">
                <ImageIcon className="h-4.5 w-4.5" />
              </button>
              <button className="rounded-full p-2 hover:bg-accent/10 cursor-pointer">
                <Video className="h-4.5 w-4.5" />
              </button>
              <button className="rounded-full p-2 hover:bg-accent/10 cursor-pointer">
                <Smile className="h-4.5 w-4.5" />
              </button>
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button size="sm" disabled={!text.trim()} onClick={submit}>
                Publier
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
