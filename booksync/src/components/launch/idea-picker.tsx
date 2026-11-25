"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { findIdea, TALENTS } from "@/domain/launch/ideas";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createProductFromIdeaAction } from "@/app/tableau-de-bord/produits/actions";

/**
 * Choix d'une idée à partir de ce que la personne sait faire.
 * Public : l'idée suit l'inscription. Tableau de bord : elle devient directement un produit.
 */
export function IdeaPicker({
  mode,
  initialIdeaId,
}: {
  mode: "public" | "dashboard";
  initialIdeaId?: string;
}) {
  const router = useRouter();
  const initialTalent = TALENTS.find((t) => t.ideas.some((i) => i.id === initialIdeaId));
  const [talentId, setTalentId] = useState<string | null>(initialTalent?.id ?? null);
  const [ideaId, setIdeaId] = useState<string | null>(initialTalent ? initialIdeaId! : null);
  const [pending, startTransition] = useTransition();
  const talent = TALENTS.find((t) => t.id === talentId) ?? null;
  const idea = ideaId ? findIdea(ideaId) : null;

  return (
    <div className="grid gap-6" data-testid="idea-finder">
      <section className="rounded-3xl border bg-card p-5 shadow-xs sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Lightbulb className="size-5 text-primary" /> 1. Qu&apos;est-ce que vous savez déjà faire ?
        </h2>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Ce que vous savez faire">
          {TALENTS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                aria-pressed={talentId === t.id}
                onClick={() => {
                  setTalentId(t.id);
                  setIdeaId(t.ideas.length === 1 ? t.ideas[0].id : null);
                }}
                className="rounded-full border px-3.5 py-2 text-sm transition-colors aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground"
              >
                {t.emoji} {t.label}
              </button>
            </li>
          ))}
        </ul>
        {talent && talent.ideas.length > 1 ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {talent.ideas.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => setIdeaId(i.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left text-sm transition-colors hover:border-primary/40",
                  ideaId === i.id && "border-primary bg-primary-soft",
                )}
              >
                <span className="font-semibold">{i.title}</span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {idea ? (
        <section className="rounded-3xl border bg-card p-5 shadow-xs sm:p-6" data-testid="idea-card">
          <p className="text-sm font-semibold text-primary">2. Votre idée</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{idea.title}</h2>
          <p className="mt-2 text-muted-foreground">{idea.why}</p>
          <p className="mt-4 text-sm">
            <span className="font-semibold">Prix de départ conseillé :</span>{" "}
            {formatCents(idea.priceCents)} {idea.unit}
          </p>
          <p className="mt-1 text-sm">
            <span className="font-semibold">À qui le vendre :</span> {idea.audience}
          </p>
          <p className="mt-5 text-sm font-semibold">Vos 3 premières actions cette semaine</p>
          <ol className="mt-2 grid gap-2">
            {idea.firstSteps.map((s) => (
              <li key={s} className="flex gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" /> {s}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            Les prix sont des points de départ à ajuster. Aucun revenu n&apos;est garanti : tout
            dépend de ce que vous mettez en place.
          </p>
          <div className="mt-5">
            {mode === "public" ? (
              <Button asChild size="lg" className="rounded-full">
                <Link
                  href={
                    `/inscription?redirection=${encodeURIComponent(`/onboarding?idee=${idea.id}`)}` as Route
                  }
                >
                  Commencer avec cette idée <ArrowRight />
                </Link>
              </Button>
            ) : (
              <Button
                size="lg"
                disabled={pending}
                data-testid="choose-idea"
                onClick={() =>
                  startTransition(async () => {
                    const res = await createProductFromIdeaAction(idea.id);
                    if (!res.ok) return void toast.error(res.error);
                    toast.success("C'est votre projet ! Prochaine étape : votre stratégie.");
                    router.push(`/tableau-de-bord/produits/${res.data.id}` as Route);
                  })
                }
              >
                Je choisis cette idée <ArrowRight />
              </Button>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
