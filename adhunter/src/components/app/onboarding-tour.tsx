"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NICHES } from "@/lib/ads/catalog";
import { completeTutorial } from "@/lib/actions/account";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    target: null,
    title: "Bienvenue sur AdHunter 👋",
    text: "En 1 minute, découvre comment trouver des publicités inspirantes, les comprendre et créer les tiennes. Tu peux passer ce tutoriel à tout moment.",
  },
  { target: "niches", title: "Quelles niches t'intéressent ?", text: "Sélectionne une ou plusieurs niches : nous personnaliserons tes suggestions sur le tableau de bord." },
  {
    target: "library",
    title: "1. Ad Library",
    text: "Recherche des publicités dans les bibliothèques officielles (Meta, TikTok) par niche, pays, langue, format ou mot-clé. Chaque annonce renvoie vers sa source.",
  },
  {
    target: "analyzer",
    title: "2. AI Analyzer",
    text: "Sur une publicité, clique « Analyser avec l'IA » : accroche, cible probable, techniques, forces, faiblesses et idées. Ce sont des estimations, pas des chiffres de performance.",
  },
  {
    target: "creator",
    title: "3. Ad Creator",
    text: "Décris ton produit et obtiens des accroches, textes, CTA et concepts vidéo originaux, adaptés à TikTok, Instagram et Facebook (Pro et Business).",
  },
  { target: "trends", title: "4. Trend Radar", text: "Observe les niches, mots-clés et formats qui reviennent dans les données collectées, toujours avec la taille de l'échantillon." },
  {
    target: "favorites",
    title: "5. Favoris et collections",
    text: "Enregistre les publicités qui t'inspirent, ajoute des notes et range-les dans des collections. Tout est synchronisé avec ton compte.",
  },
] as const;

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  const [niches, setNiches] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const current = STEPS[step];

  useEffect(() => {
    if (!current.target || current.target === "niches") return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    if (!el || el.offsetParent === null) return;
    el.classList.add("ring-2", "ring-primary", "bg-secondary");
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    return () => el.classList.remove("ring-2", "ring-primary", "bg-secondary");
  }, [current.target]);

  function finish(goToLibrary: boolean) {
    startTransition(async () => {
      await completeTutorial(niches.length ? niches : undefined);
      setOpen(false);
      if (goToLibrary) router.push(niches[0] ? `/app/library?niche=${niches[0]}` : "/app/library");
      else router.refresh();
    });
  }

  if (!open) return null;
  const last = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-title"
      className="fixed inset-x-3 top-20 z-50 animate-fade-in-up rounded-2xl border border-primary/40 bg-card p-5 shadow-glow sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:w-[400px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] text-violet-400">Étape {step + 1} / {STEPS.length}</p>
          <h2 id="tour-title" className="mt-1 font-semibold">{current.title}</h2>
        </div>
        <button onClick={() => finish(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Passer le tutoriel">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{current.text}</p>
      {current.target === "niches" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {NICHES.map((n) => {
            const on = niches.includes(n.id);
            return (
              <button
                key={n.id}
                type="button"
                aria-pressed={on}
                onClick={() => setNiches((prev) => (on ? prev.filter((x) => x !== n.id) : [...prev, n.id]))}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  on ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {n.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || pending}>
          <ArrowLeft /> Retour
        </Button>
        {last ? (
          <Button variant="brand" size="sm" onClick={() => finish(true)} disabled={pending}>
            Lancer ma première recherche <ArrowRight />
          </Button>
        ) : (
          <Button variant="brand" size="sm" onClick={() => setStep((s) => s + 1)}>
            Suivant <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
}
