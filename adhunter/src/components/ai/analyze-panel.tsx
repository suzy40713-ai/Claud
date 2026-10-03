"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AnalysisView } from "@/components/ai/analysis-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analyzeAdAction } from "@/lib/actions/ai";
import type { AdAnalysis } from "@/lib/ai/schemas";

const LOADING_STEPS = ["Lecture de la publicité…", "Analyse de l'accroche et de la cible…", "Identification des techniques…", "Rédaction des idées et recommandations…"];

export function AnalyzePanel({
  adId,
  initial,
  remaining,
  available,
}: {
  adId: string;
  initial: { result: AdAnalysis; isDemo: boolean } | null;
  remaining: number | null;
  available: boolean;
}) {
  const [analysis, setAnalysis] = useState(initial);
  const [focus, setFocus] = useState("");
  const [pending, start] = useTransition();
  const [stepIdx, setStepIdx] = useState(0);
  const [error, setError] = useState<{ message: string; upgrade: boolean } | null>(null);

  function run() {
    setError(null);
    setStepIdx(0);
    const timer = setInterval(() => setStepIdx((i) => Math.min(i + 1, LOADING_STEPS.length - 1)), 4000);
    start(async () => {
      const res = await analyzeAdAction(adId, focus);
      clearInterval(timer);
      if (!res.ok) {
        setError({ message: res.error, upgrade: res.code === "quota_exceeded" || res.code === "plan_required" });
        return;
      }
      setAnalysis({ result: res.data.result, isDemo: res.data.isDemo });
      toast.success("Analyse terminée");
    });
  }

  return (
    <div className="space-y-4">
      <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Input
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="Facultatif : un point à creuser (ex. : comment adapter à mon produit bio ?)"
          maxLength={300}
          aria-label="Point d'attention pour l'analyse"
          disabled={pending || !available}
        />
        <Button variant="brand" onClick={run} disabled={pending || !available} className="shrink-0">
          {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {analysis ? "Relancer l'analyse" : "Analyser avec l'IA"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {!available
          ? "L'analyse IA est en préparation sur cette instance (clé API non configurée)."
          : remaining === null
            ? "Analyses illimitées."
            : `${remaining} analyse${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} ce mois-ci. Une analyse échouée n'est pas décomptée.`}
      </p>
      {error && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error.message}{" "}
          {error.upgrade && <Link href="/app/billing" className="underline">Voir les formules</Link>}
        </div>
      )}
      {pending && (
        <div className="surface space-y-3 p-5" aria-live="polite">
          <p className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin text-violet-400" /> {LOADING_STEPS[stepIdx]}</p>
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-5/6" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      )}
      {!pending && analysis && <AnalysisView analysis={analysis.result} isDemo={analysis.isDemo} />}
    </div>
  );
}
