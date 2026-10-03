"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { CreationView } from "@/components/ai/creation-view";
import { InfoTip } from "@/components/shared/info-tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAdsAction } from "@/lib/actions/ai";
import { GOAL_LABELS, PLATFORM_LABELS, TONE_LABELS, type AdCreation, type CreatorInput } from "@/lib/ai/schemas";

const selectClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CreatorForm({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<{ message: string; upgrade: boolean } | null>(null);
  const [result, setResult] = useState<{ id: string; title: string; data: AdCreation; isDemo: boolean } | null>(null);
  const [form, setForm] = useState<CreatorInput>({
    productName: "",
    description: "",
    audience: "",
    platform: "all",
    tone: "amical",
    goal: "ventes",
  });

  const set = <K extends keyof CreatorInput>(k: K, v: CreatorInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createAdsAction(form);
      if (!res.ok) {
        setError({ message: res.error, upgrade: res.code === "quota_exceeded" || res.code === "plan_required" });
        return;
      }
      setResult({ id: res.data.id, title: form.productName, data: res.data.result, isDemo: res.data.isDemo });
      toast.success("Ta campagne est prête et enregistrée");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="surface grid gap-4 p-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="productName" className="text-xs font-medium text-muted-foreground">Nom du produit</label>
          <Input id="productName" value={form.productName} onChange={(e) => set("productName", e.target.value)} required maxLength={80} placeholder="ex. : Gourde isotherme Alto" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="audience" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            Public cible <InfoTip>Décris ton client idéal : âge, situation, problème principal. Plus c'est précis, meilleurs sont les textes.</InfoTip>
          </label>
          <Input id="audience" value={form.audience} onChange={(e) => set("audience", e.target.value)} required maxLength={300} placeholder="ex. : sportives 25-40 ans qui s'entraînent avant le travail" />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="description" className="text-xs font-medium text-muted-foreground">Description du produit</label>
          <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} required maxLength={1500} rows={4} placeholder="Ce que fait le produit, ses bénéfices, ce qui le rend différent, son prix si tu veux le mentionner…" />
          <p className="text-right text-[11px] text-muted-foreground">{form.description.length} / 1500</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 md:col-span-2">
          <div className="space-y-1.5">
            <label htmlFor="platform" className="text-xs font-medium text-muted-foreground">Plateforme</label>
            <select id="platform" className={selectClass} value={form.platform} onChange={(e) => set("platform", e.target.value as CreatorInput["platform"])}>
              {Object.entries(PLATFORM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tone" className="text-xs font-medium text-muted-foreground">Ton</label>
            <select id="tone" className={selectClass} value={form.tone} onChange={(e) => set("tone", e.target.value as CreatorInput["tone"])}>
              {Object.entries(TONE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="goal" className="text-xs font-medium text-muted-foreground">Objectif</label>
            <select id="goal" className={selectClass} value={form.goal} onChange={(e) => set("goal", e.target.value as CreatorInput["goal"])}>
              {Object.entries(GOAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-2">
            {error.message} {error.upgrade && <Link href="/app/billing" className="underline">Voir les formules</Link>}
          </div>
        )}
        <div className="md:col-span-2">
          <Button type="submit" variant="brand" disabled={pending || disabled} className="w-full sm:w-auto">
            {pending ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {pending ? "Génération en cours (≈ 30 s)…" : "Générer ma campagne"}
          </Button>
        </div>
      </form>
      {pending && (
        <div className="surface space-y-3 p-5" aria-live="polite">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-5/6" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      )}
      {result && !pending && <CreationView key={result.id} id={result.id} title={result.title} initial={result.data} isDemo={result.isDemo} />}
    </div>
  );
}
