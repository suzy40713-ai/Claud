"use client";

import { Eye } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import LiveBadge from "@/components/ui/LiveBadge";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import type { LiveMatch } from "@/types";
import { formatNombre } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function MatchCard({
  match,
  active,
  onClick,
  delay = 0,
}: {
  match: LiveMatch;
  active?: boolean;
  onClick?: () => void;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <Card
        onClick={onClick}
        className={cn(
          "cursor-pointer overflow-hidden p-0",
          active && "border-accent/50 ring-1 ring-accent/30"
        )}
      >
        <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-surface-2 to-black">
          <div className="flex items-center gap-3">
            <Avatar type="club" nom={match.clubDomicile} seed={match.clubDomicileLogo} size="md" />
            <span className="font-display text-lg font-bold">
              {match.scoreDomicile} - {match.scoreExterieur}
            </span>
            <Avatar type="club" nom={match.clubExterieur} seed={match.clubExterieurLogo} size="md" />
          </div>
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {match.isLive ? <LiveBadge /> : (
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold text-muted">REPLAY</span>
            )}
          </div>
          {match.isLive && (
            <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white">
              {match.minute}&apos;
            </span>
          )}
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] text-white/80">
            <Eye className="h-3 w-3" /> {formatNombre(match.spectateurs)}
          </span>
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-semibold">{match.titre}</p>
          <p className="text-xs text-muted">{match.competition} · {match.streamer} · {match.plateforme}</p>
        </div>
      </Card>
    </Reveal>
  );
}
