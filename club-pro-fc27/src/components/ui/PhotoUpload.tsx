"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Gamepad2, ShieldHalf, Upload, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "./Button";
import Avatar from "./Avatar";

export default function PhotoUpload({
  accountType,
  nom,
  currentSeed,
  onConfirm,
}: {
  accountType: "joueur" | "club";
  nom: string;
  currentSeed?: string;
  onConfirm?: (dataUrl: string) => void;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isClub = accountType === "club";

  const onFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setPos({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirm = () => {
    if (!imageSrc) return;
    onConfirm?.(imageSrc);
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs",
          isClub
            ? "border-gold/30 bg-gold/8 text-gold"
            : "border-accent/30 bg-accent/8 text-accent"
        )}
      >
        {isClub ? <ShieldHalf className="mt-0.5 h-4 w-4 shrink-0" /> : <Gamepad2 className="mt-0.5 h-4 w-4 shrink-0" />}
        <p className="leading-relaxed">
          {isClub
            ? "Clubs : uploadez le logo / blason officiel de votre club tel qu'il apparaît en jeu. Pas de photo personnelle."
            : "Joueurs : uploadez une capture d'écran ou un rendu de votre Pro en jeu (avatar in-game FC 27). Pas de photo personnelle ni d'image aléatoire."}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div
          ref={frameRef}
          onPointerDown={(e) => {
            if (!imageSrc) return;
            dragging.current = true;
            last.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerMove={(e) => {
            if (!dragging.current) return;
            const dx = e.clientX - last.current.x;
            const dy = e.clientY - last.current.y;
            last.current = { x: e.clientX, y: e.clientY };
            setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
          }}
          onPointerUp={() => (dragging.current = false)}
          onPointerLeave={() => (dragging.current = false)}
          className={cn(
            "relative h-40 w-40 select-none overflow-hidden border-2 border-dashed border-white/20 bg-surface-2",
            isClub ? "rounded-2xl" : "rounded-full",
            imageSrc && "cursor-grab active:cursor-grabbing border-solid border-accent/40"
          )}
        >
          {imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt="Prévisualisation"
              draggable={false}
              className="pointer-events-none absolute top-1/2 left-1/2 h-full w-full max-w-none object-cover"
              style={{
                transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
              }}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
              <Avatar type={accountType} nom={nom} seed={currentSeed} size="2xl" className="h-full w-full text-2xl" />
            </div>
          )}
        </div>

        {imageSrc && (
          <div className="flex w-full max-w-[220px] items-center gap-2">
            <ZoomIn className="h-4 w-4 text-muted" />
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
        />

        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 cursor-pointer"
          >
            {imageSrc ? <Camera className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            {imageSrc ? "Changer l'image" : "Choisir une image"}
          </motion.button>
          {imageSrc && (
            <Button variant="primary" size="md" onClick={handleConfirm}>
              Valider
            </Button>
          )}
        </div>

        {imageSrc && (
          <p className="max-w-[260px] text-center text-[11px] text-muted">
            Glissez l&apos;image pour la recadrer, ajustez le zoom, puis validez.
          </p>
        )}
      </div>
    </div>
  );
}
