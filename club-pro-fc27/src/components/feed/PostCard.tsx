"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, Heart, MessageCircle, PlayCircle, Share, Zap } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import type { Post } from "@/types";
import { formatNombre, tempsRelatif } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [shared, setShared] = useState(false);
  const [burst, setBurst] = useState(false);

  const profileHref =
    post.auteurType === "club" ? `/club/${post.auteurId}` : `/joueur/${post.auteurId}`;

  const toggleLike = () => {
    setLiked((v) => !v);
    setLikes((v) => (liked ? v - 1 : v + 1));
    if (!liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 600);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-surface-border p-4 transition-colors hover:bg-white/[0.015]"
    >
      <div className="flex gap-3">
        <Link href={profileHref} className="shrink-0">
          <Avatar type={post.auteurType} nom={post.auteurNom} seed={post.auteurAvatar} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm">
            <Link href={profileHref} className="truncate font-semibold hover:underline">
              {post.auteurNom}
            </Link>
            {post.auteurVerifie && <BadgeCheck className="h-4 w-4 shrink-0 fill-accent text-background" />}
            <span className="shrink-0 text-muted">· {tempsRelatif(post.date)}</span>
          </div>

          <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-foreground/95">
            {post.contenu}
          </p>

          {post.clipBut && (
            <div className="relative mt-3 flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-gradient-to-br from-surface-2 to-black">
              <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-accent">
                <Zap className="h-3 w-3" /> CLIP DE BUT
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 cursor-pointer"
              >
                <PlayCircle className="h-8 w-8 text-white" />
              </motion.button>
            </div>
          )}
          {post.image && !post.clipBut && (
            <div className="mt-3 aspect-video rounded-xl border border-surface-border bg-gradient-to-br from-surface-2 to-black" />
          )}

          <div className="mt-3 flex max-w-xs items-center justify-between text-muted">
            <button
              onClick={toggleLike}
              className={cn(
                "group relative flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:text-rose-400 cursor-pointer",
                liked && "text-rose-400"
              )}
            >
              <motion.span whileTap={{ scale: 0.8 }} className="relative inline-flex">
                <Heart
                  className={cn("h-4 w-4 transition-transform group-hover:scale-110", liked && "fill-rose-400")}
                />
                <AnimatePresence>
                  {burst && (
                    <motion.span
                      initial={{ scale: 0.4, opacity: 1 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 rounded-full bg-rose-400/40"
                    />
                  )}
                </AnimatePresence>
              </motion.span>
              {formatNombre(likes)}
            </button>
            <button className="group flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:text-sky-400 cursor-pointer">
              <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
              {formatNombre(post.commentaires)}
            </button>
            <motion.button
              onClick={() => setShared((v) => !v)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "group flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs hover:text-emerald-400 cursor-pointer",
                shared && "text-emerald-400"
              )}
            >
              <Share className="h-4 w-4 group-hover:scale-110 transition-transform" />
              {formatNombre(post.partages + (shared ? 1 : 0))}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
