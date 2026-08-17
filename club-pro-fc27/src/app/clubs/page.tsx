"use client";

import Link from "next/link";
import { BadgeCheck, Shield, Users } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Reveal from "@/components/ui/Reveal";
import { clubs } from "@/lib/mock-data";
import { formatNombre } from "@/lib/utils";

export default function ClubsPage() {
  const sorted = [...clubs].sort((a, b) => a.classementRang - b.classementRang);

  return (
    <div>
      <div className="glass sticky top-14 z-30 border-b border-surface-border px-4 py-3">
        <h1 className="flex items-center gap-2 font-display text-lg font-bold">
          <Shield className="h-5 w-5 text-accent" /> Clubs
        </h1>
        <p className="text-xs text-muted">{clubs.length} clubs sur la plateforme</p>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.05}>
            <Link href={`/club/${c.id}`}>
              <Card className={c.vitrine ? "border-gold/30 p-4" : "p-4"}>
                <div className="flex items-center gap-3">
                  <Avatar type="club" nom={c.nom} seed={c.id} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-display font-bold">{c.nom}</p>
                      {c.verifie && <BadgeCheck className="h-4 w-4 shrink-0 fill-accent text-background" />}
                    </div>
                    <p className="text-xs text-muted">{c.region} · Rang #{c.classementRang}</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-muted">{c.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Users className="h-3.5 w-3.5" /> {formatNombre(c.followers)} abonnés
                  </span>
                  {c.vitrine && <Badge tone="gold">Vitrine</Badge>}
                </div>
              </Card>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
