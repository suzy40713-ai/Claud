"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, Lock, RotateCcw, Search } from "lucide-react";

import { InfoTip } from "@/components/shared/info-tip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES, FORMATS, LANGUAGES, NICHES } from "@/lib/ads/catalog";
import type { SearchFilters } from "@/lib/ads/types";
import { cn } from "@/lib/utils";

const selectClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

function Field({ label, htmlFor, tip, children, className }: { label: string; htmlFor: string; tip?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {label}
        {tip && <InfoTip>{tip}</InfoTip>}
      </label>
      {children}
    </div>
  );
}

export function SearchFiltersForm({
  filters,
  sources,
  advanced,
}: {
  filters: SearchFilters;
  sources: { id: string; label: string; available: boolean }[];
  advanced: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [k, v] of data.entries()) if (typeof v === "string" && v.trim()) params.set(k, v.trim());
    start(() => router.push(`/app/library?${params.toString()}`));
  }

  return (
    <form onSubmit={onSubmit} className="surface space-y-4 p-4 sm:p-5" role="search" aria-label="Rechercher des publicités">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={filters.q} placeholder="Mot-clé, produit, marque… (ex. : sérum, sneakers, robot cuisine)" className="pl-9" aria-label="Mot-clé" maxLength={100} />
        </div>
        <Button type="submit" variant="brand" disabled={pending} className="sm:w-40">
          {pending ? <Loader2 className="animate-spin" /> : <Search />}
          Rechercher
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Field label="Niche" htmlFor="niche" tip="Si tu ne saisis pas de mot-clé, AdHunter recherche avec un terme représentatif de la niche.">
          <select id="niche" name="niche" defaultValue={filters.niche ?? ""} className={selectClass}>
            <option value="">Toutes</option>
            {NICHES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </Field>
        <Field label="Plateforme" htmlFor="platform" tip="Seules les sources officielles configurées sont interrogées.">
          <select id="platform" name="platform" defaultValue={filters.platform ?? "all"} className={selectClass}>
            <option value="all">Toutes les sources</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id} disabled={!s.available}>
                {s.label}{s.available ? "" : " (en préparation)"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pays" htmlFor="country" tip="Les bibliothèques officielles publient les publicités commerciales diffusées dans l'UE/EEE.">
          <select id="country" name="country" defaultValue={filters.country} className={selectClass}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Langue" htmlFor="language">
          <select id="language" name="language" defaultValue={filters.language ?? ""} className={selectClass}>
            <option value="">Toutes</option>
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </Field>
        <Field label="Format" htmlFor="format">
          <select id="format" name="format" defaultValue={filters.format ?? ""} className={selectClass}>
            <option value="">Tous</option>
            {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </Field>
        <Field label="Diffusée depuis" htmlFor="dateFrom" tip="Période de diffusion, lorsque la source fournit les dates.">
          <Input id="dateFrom" name="dateFrom" type="date" defaultValue={filters.dateFrom} />
        </Field>
      </div>
      <details className="group" open={advanced && Boolean(filters.advertiser || filters.status || filters.dateTo)}>
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
          Recherche avancée {!advanced && <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px]"><Lock className="h-3 w-3" /> Business</span>}
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Jusqu'au" htmlFor="dateTo">
            <Input id="dateTo" name="dateTo" type="date" defaultValue={filters.dateTo} disabled={!advanced} />
          </Field>
          <Field label="Statut" htmlFor="status">
            <select id="status" name="status" defaultValue={filters.status ?? "all"} className={selectClass} disabled={!advanced}>
              <option value="all">Actives et terminées</option>
              <option value="active">Actives uniquement</option>
              <option value="inactive">Terminées uniquement</option>
            </select>
          </Field>
          <Field label="ID annonceur" htmlFor="advertiser" tip="ID de page Meta ou ID d'entreprise TikTok (séparés par des virgules). Visible dans l'URL de la bibliothèque officielle.">
            <Input id="advertiser" name="advertiser" defaultValue={filters.advertiser} placeholder="ex. 123456789" disabled={!advanced} />
          </Field>
        </div>
      </details>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/app/library")}>
          <RotateCcw /> Réinitialiser
        </Button>
      </div>
    </form>
  );
}
