"use client";

import { useState } from "react";
import { Eye, Grid2x2, MonitorPlay, Radio } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import LiveBadge from "@/components/ui/LiveBadge";
import Reveal from "@/components/ui/Reveal";
import MatchCard from "@/components/live/MatchCard";
import LiveChat from "@/components/live/LiveChat";
import { liveMatches } from "@/lib/mock-data";
import { formatNombre } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function LivePage() {
  const enDirect = liveMatches.filter((m) => m.isLive);
  const replays = liveMatches.filter((m) => !m.isLive);
  const [selected, setSelected] = useState(enDirect[0]);
  const [mode, setMode] = useState<"single" | "multi">("single");

  return (
    <div>
      <div className="glass sticky top-0 z-30 flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h1 className="flex items-center gap-2 font-display text-lg font-bold">
          <Radio className="h-5 w-5 text-live" /> Live
        </h1>
        <div className="flex gap-1 rounded-full border border-surface-border p-1">
          <button
            onClick={() => setMode("single")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer",
              mode === "single" ? "bg-white/10 text-foreground" : "text-muted"
            )}
          >
            <MonitorPlay className="h-3.5 w-3.5" /> Focus
          </button>
          <button
            onClick={() => setMode("multi")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold cursor-pointer",
              mode === "multi" ? "bg-white/10 text-foreground" : "text-muted"
            )}
          >
            <Grid2x2 className="h-3.5 w-3.5" /> Multi-stream
          </button>
        </div>
      </div>

      {mode === "single" ? (
        <div className="flex flex-col lg:flex-row">
          <div className="min-w-0 flex-1 p-4">
            <Reveal>
              <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-surface-border bg-gradient-to-br from-surface-2 to-black">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar type="club" nom={selected.clubDomicile} seed={selected.clubDomicileLogo} size="xl" />
                    <span className="text-sm font-semibold">{selected.clubDomicile}</span>
                  </div>
                  <span className="font-display text-4xl font-extrabold">
                    {selected.scoreDomicile} - {selected.scoreExterieur}
                  </span>
                  <div className="flex flex-col items-center gap-2">
                    <Avatar type="club" nom={selected.clubExterieur} seed={selected.clubExterieurLogo} size="xl" />
                    <span className="text-sm font-semibold">{selected.clubExterieur}</span>
                  </div>
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <LiveBadge />
                  <span className="rounded-full bg-black/60 px-2 py-1 text-xs font-semibold text-white">
                    {selected.minute}&apos;
                  </span>
                </div>
                <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white/85">
                  <Eye className="h-3.5 w-3.5" /> {formatNombre(selected.spectateurs)} spectateurs
                </span>
              </div>
              <div className="mt-3">
                <p className="font-display text-lg font-bold">{selected.titre}</p>
                <p className="text-sm text-muted">{selected.competition} · Diffusé par {selected.streamer} sur {selected.plateforme}</p>
              </div>
            </Reveal>

            <h2 className="mt-6 mb-3 font-display text-base font-bold">Autres directs</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {enDirect
                .filter((m) => m.id !== selected.id)
                .map((m, i) => (
                  <MatchCard key={m.id} match={m} onClick={() => setSelected(m)} delay={i * 0.05} />
                ))}
            </div>
          </div>
          <div className="h-[420px] shrink-0 border-t border-surface-border lg:h-auto lg:w-80 lg:border-t-0 lg:border-l">
            <LiveChat />
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {enDirect.map((m, i) => (
              <MatchCard key={m.id} match={m} delay={i * 0.05} />
            ))}
          </div>
        </div>
      )}

      {replays.length > 0 && (
        <div className="border-t border-surface-border p-4">
          <h2 className="mb-3 font-display text-base font-bold">Replays disponibles</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {replays.map((m, i) => (
              <MatchCard key={m.id} match={m} delay={i * 0.05} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
