"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const COLORS = ["#17e58a", "#f2c14e", "#22d3ee", "#a78bfa", "#fb7185", "#fbbf24"];

interface Piece {
  id: number;
  left: number;
  color: string;
  rotate: number;
  delay: number;
  duration: number;
  drift: number;
  shape: "rect" | "circle";
}

export default function Confetti({ active, count = 90 }: { active: boolean; count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- generates a fresh confetti burst each time `active` flips true
    setPieces(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotate: Math.random() * 360,
        delay: Math.random() * 0.5,
        duration: 2.2 + Math.random() * 1.4,
        drift: (Math.random() - 0.5) * 200,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      }))
    );
    const t = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(t);
  }, [active, count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <AnimatePresence>
        {pieces.map((p) => (
          <motion.span
            key={p.id}
            initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
            animate={{ y: "108vh", x: p.drift, opacity: [1, 1, 0], rotate: p.rotate }}
            transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: 0,
              width: 8,
              height: p.shape === "rect" ? 14 : 8,
              backgroundColor: p.color,
              borderRadius: p.shape === "circle" ? "50%" : 2,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
