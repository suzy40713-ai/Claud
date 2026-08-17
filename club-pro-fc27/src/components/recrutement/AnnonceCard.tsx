"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Globe2, MapPin } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import ArchetypeBadge from "@/components/ui/ArchetypeBadge";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import type { AnnonceRecrutement } from "@/types";
import { POSTE_LABELS } from "@/lib/constants";
import { tempsRelatif } from "@/lib/utils";

export default function AnnonceCard({
  annonce,
  delay = 0,
  onOrganiserEssai,
}: {
  annonce: AnnonceRecrutement;
  delay?: number;
  onOrganiserEssai?: (annonce: AnnonceRecrutement) => void;
}) {
  const [postule, setPostule] = useState(false);
  const profileHref = annonce.type === "club" ? `/club/${annonce.auteurId}` : `/joueur/${annonce.auteurId}`;

  return (
    <Reveal delay={delay}>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Link href={profileHref}>
            <Avatar type={annonce.type === "club" ? "club" : "joueur"} nom={annonce.auteurNom} seed={annonce.auteurLogo} size="md" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={profileHref} className="truncate text-sm font-semibold hover:underline">
                {annonce.auteurNom}
              </Link>
              <Badge tone={annonce.type === "club" ? "gold" : "blue"}>
                {annonce.type === "club" ? "Club recrute" : "Cherche club"}
              </Badge>
            </div>
            <p className="mt-1 font-display font-bold">{annonce.titre}</p>
            <p className="mt-1 text-sm text-muted">{annonce.description}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="gray">{POSTE_LABELS[annonce.poste]}</Badge>
              {annonce.archetype && <ArchetypeBadge archetype={annonce.archetype} size="sm" />}
              <Badge tone="gray">Niv. {annonce.niveauMin}+</Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {annonce.region}</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {annonce.disponibilite}</span>
              <span className="flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" /> {annonce.langues.join(", ")}</span>
              <span>{tempsRelatif(annonce.date)}</span>
            </div>

            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant={postule ? "outline" : "primary"}
                disabled={postule}
                onClick={() => setPostule(true)}
              >
                {postule ? "Candidature envoyée" : "Postuler"}
              </Button>
              {annonce.type === "club" && (
                <Button size="sm" variant="ghost" onClick={() => onOrganiserEssai?.(annonce)}>
                  <Calendar className="h-4 w-4" /> Organiser un essai
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Reveal>
  );
}
