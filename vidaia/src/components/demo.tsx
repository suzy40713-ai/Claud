"use client";

import { useEffect, useRef } from "react";
import { drawFrame, H, W, type Timeline } from "./renderer";
import type { VideoScript } from "@/lib/script";

/** Démonstration en boucle (sans son) du rendu VidaIA, avec un script d'exemple. */
const SAMPLE: VideoScript = {
  hook: "3 erreurs qui tuent tes vidéos 🎬",
  hookVoice: "",
  points: [
    { title: "Une accroche molle", detail: "Les 2 premières secondes décident de tout", voice: "" },
    { title: "Trop d'idées", detail: "Une vidéo, un seul message", voice: "" },
    { title: "Pas d'appel à l'action", detail: "Dis clairement quoi faire ensuite", voice: "" },
  ],
  closing: "Corrige-les dès ta prochaine vidéo",
  closingVoice: "",
  cta: "Abonne-toi 🔔",
};
const TL: Timeline = { starts: [0, 2.6, 5.4, 8.2, 11], voiceEnd: 13, duration: 14 };

export function Demo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      const t = ((performance.now() - start) / 1000) % TL.duration;
      drawFrame(ctx, SAMPLE, TL, "violet", t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      aria-label="Exemple de vidéo VidaIA"
      className="aspect-[9/16] w-full max-w-[300px] rounded-[2rem] border-4 border-[#241a3d] shadow-2xl"
    />
  );
}
