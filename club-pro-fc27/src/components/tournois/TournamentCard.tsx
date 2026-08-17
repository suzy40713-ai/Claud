import Link from "next/link";
import { Calendar, Crown, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import type { Tournoi } from "@/types";
import { cn } from "@/lib/utils";

const STATUT_TONE = {
  "À venir": "blue",
  "En cours": "green",
  Terminé: "gray",
} as const;

export default function TournamentCard({ tournoi, delay = 0 }: { tournoi: Tournoi; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <Link href={`/tournois/${tournoi.id}`}>
        <Card className={cn("overflow-hidden p-0", tournoi.sponsorise && "border-gold/25")}>
          <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-surface-2 to-black">
            <Avatar type="club" nom={tournoi.nom} seed={tournoi.image} size="xl" />
            {tournoi.sponsorise && (
              <span className="animate-pulse-cta absolute top-2 right-2 flex items-center gap-1 rounded-full bg-gradient-to-r from-gold to-amber-400 px-2 py-1 text-[10px] font-bold text-[#241a02]">
                <Crown className="h-3 w-3" /> {tournoi.cashprize}
              </span>
            )}
            <Badge tone={STATUT_TONE[tournoi.statut]} className="absolute top-2 left-2">
              {tournoi.statut}
            </Badge>
          </div>
          <div className="p-3.5">
            <p className="truncate font-display font-bold">{tournoi.nom}</p>
            <p className="text-xs text-muted">{tournoi.format} · Organisé par {tournoi.organisateur}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(tournoi.dateDebut).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {tournoi.clubsInscrits}/{tournoi.clubsMax}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-dim to-accent"
                style={{ width: `${(tournoi.clubsInscrits / tournoi.clubsMax) * 100}%` }}
              />
            </div>
          </div>
        </Card>
      </Link>
    </Reveal>
  );
}
