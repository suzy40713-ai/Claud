import Link from "next/link";
import { Flame, TrendingUp, Trophy } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DivisionBadge from "@/components/ui/DivisionBadge";
import { clubs, joueurs, tournois } from "@/lib/mock-data";
import { formatNombre } from "@/lib/utils";

export default function TrendingSidebar() {
  const afc = clubs[0];
  const suggestions = joueurs.filter((j) => j.id !== "moi").slice(3, 6);
  const upcoming = tournois.filter((t) => t.statut === "À venir").slice(0, 2);

  return (
    <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 space-y-4 overflow-y-auto px-4 py-5 xl:block">
      <Card id="postuler" className="overflow-hidden border-gold/25 bg-gradient-to-br from-gold/10 via-surface to-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-gold" />
          <span className="text-xs font-bold tracking-wide text-gold uppercase">Projet vitrine</span>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <Avatar type="club" nom={afc.nom} seed={afc.id} size="md" />
          <div>
            <p className="font-display font-bold">{afc.nom}</p>
            <p className="text-xs text-muted">Rang #{afc.classementRang} · {formatNombre(afc.followers)} abonnés</p>
          </div>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-muted">
          Recrutement mondial ouvert : African FC rassemble les meilleurs talents Pro Clubs. Postulez maintenant.
        </p>
        <Link href="/african-fc">
          <Button variant="gold" size="sm" className="w-full" pulse>
            Découvrir African FC
          </Button>
        </Link>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          <TrendingUp className="h-4 w-4 text-accent" /> Joueurs à suivre
        </div>
        <div className="space-y-3">
          {suggestions.map((j) => (
            <Link key={j.id} href={`/joueur/${j.id}`} className="flex items-center gap-2 group">
              <Avatar type="joueur" nom={j.pseudo} seed={j.id} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold group-hover:text-accent">{j.pseudo}</p>
                <p className="truncate text-xs text-muted">{j.poste} · {j.archetype}</p>
              </div>
              <DivisionBadge division={j.division} size="sm" />
            </Link>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Trophy className="h-4 w-4 text-gold" /> Tournois à venir
        </div>
        <div className="space-y-3">
          {upcoming.map((t) => (
            <Link key={t.id} href={`/tournois/${t.id}`} className="block group">
              <p className="truncate text-sm font-semibold group-hover:text-accent">{t.nom}</p>
              <p className="text-xs text-muted">
                {t.format} · {t.clubsInscrits}/{t.clubsMax} clubs
                {t.cashprize ? ` · ${t.cashprize}` : ""}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <p className="px-2 text-[11px] text-muted">Club Pro FC 27 © 2026 · Communauté Pro Clubs</p>
    </aside>
  );
}
