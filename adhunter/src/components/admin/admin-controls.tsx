"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { purgeResolvedErrors, resolveError, setFeatureFlag, setManualPlan, setUserRole, updatePlan } from "@/lib/actions/admin";
import type { PlanLimits } from "@/types/database";

const selectClass = "h-8 rounded-md border border-input bg-background px-2 text-xs";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error ?? "Erreur");
      toast.success(success);
      router.refresh();
    });
  return { pending, run };
}

export function RoleSelect({ userId, role }: { userId: string; role: "user" | "admin" }) {
  const { pending, run } = useAction();
  return (
    <select className={selectClass} defaultValue={role} disabled={pending} aria-label="Rôle"
      onChange={(e) => run(() => setUserRole(userId, e.target.value as "user" | "admin"), "Rôle mis à jour")}>
      <option value="user">Utilisateur</option>
      <option value="admin">Administrateur</option>
    </select>
  );
}

export function ManualPlanForm({ userId, plan }: { userId: string; plan: string }) {
  const { pending, run } = useAction();
  const [value, setValue] = useState(plan);
  const [until, setUntil] = useState("");
  return (
    <div className="flex items-center gap-1.5">
      <select className={selectClass} value={value} onChange={(e) => setValue(e.target.value)} aria-label="Formule">
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="business">Business</option>
      </select>
      <input type="date" value={until} onChange={(e) => setUntil(e.target.value)} className={selectClass} aria-label="Jusqu'au (facultatif)" title="Jusqu'au (facultatif)" />
      <Button size="sm" variant="outline" className="h-8" disabled={pending}
        onClick={() => run(() => setManualPlan(userId, value as "free" | "pro" | "business", until || null), "Formule attribuée")}>
        {pending ? <Loader2 className="animate-spin" /> : "Appliquer"}
      </Button>
    </div>
  );
}

export function FlagSwitch({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const { pending, run } = useAction();
  return <Switch checked={enabled} disabled={pending} aria-label={flagKey} onCheckedChange={(v) => run(() => setFeatureFlag(flagKey, v), v ? "Activée" : "Désactivée")} />;
}

export function ResolveErrorButton({ id, resolved }: { id: number; resolved: boolean }) {
  const { pending, run } = useAction();
  return (
    <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => resolveError(id, !resolved), resolved ? "Rouverte" : "Marquée résolue")}>
      {resolved ? "Rouvrir" : "Résolue"}
    </Button>
  );
}

export function PurgeErrorsButton() {
  const { pending, run } = useAction();
  return <Button size="sm" variant="outline" disabled={pending} onClick={() => confirm("Supprimer toutes les erreurs résolues ?") && run(() => purgeResolvedErrors(), "Erreurs purgées")}>Purger les erreurs résolues</Button>;
}

const LIMIT_LABELS: Record<keyof PlanLimits, string> = {
  searches_per_month: "Recherches / mois",
  ai_analyses_per_month: "Analyses IA / mois",
  ai_creations_per_month: "Ad Creator / mois",
  collections_max: "Collections max",
  results_per_search: "Résultats / recherche (1–50)",
  exports_per_month: "Exports / mois",
};

const FEATURES = ["ad_creator", "search_history", "trend_radar", "teams", "exports", "advanced_search"] as const;

export function PlanEditor({ plan }: { plan: { id: string; name: string; price_cents: number; stripe_price_id: string | null; limits: PlanLimits; features: string[]; is_active: boolean } }) {
  const { pending, run } = useAction();
  const [form, setForm] = useState({ ...plan, stripe_price_id: plan.stripe_price_id ?? "" });
  return (
    <form
      className="surface space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          () =>
            updatePlan(plan.id, {
              name: form.name,
              price_cents: Number(form.price_cents),
              stripe_price_id: form.stripe_price_id || null,
              limits: Object.fromEntries(Object.entries(form.limits).map(([k, v]) => [k, Number(v)])) as unknown as PlanLimits,
              features: form.features as (typeof FEATURES)[number][],
              is_active: form.is_active,
            }),
          "Offre mise à jour"
        );
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{plan.id.toUpperCase()}</h2>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">Active <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-xs text-muted-foreground">Nom<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="space-y-1 text-xs text-muted-foreground">Prix (centimes TTC)<Input type="number" min={0} value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })} /></label>
        <label className="space-y-1 text-xs text-muted-foreground">Stripe price ID<Input value={form.stripe_price_id} onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })} placeholder="price_…" disabled={plan.id === "free"} /></label>
      </div>
      <p className="text-xs text-muted-foreground">Limites (-1 = illimité, 0 = non inclus)</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(LIMIT_LABELS) as (keyof PlanLimits)[]).map((k) => (
          <label key={k} className="space-y-1 text-xs text-muted-foreground">
            {LIMIT_LABELS[k]}
            <Input type="number" min={-1} value={form.limits[k]} onChange={(e) => setForm({ ...form, limits: { ...form.limits, [k]: Number(e.target.value) } })} />
          </label>
        ))}
      </div>
      <fieldset className="flex flex-wrap gap-3">
        <legend className="mb-2 text-xs text-muted-foreground">Fonctionnalités incluses</legend>
        {FEATURES.map((f) => (
          <label key={f} className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" className="accent-[#7657FF]" checked={form.features.includes(f)}
              onChange={(e) => setForm({ ...form, features: e.target.checked ? [...form.features, f] : form.features.filter((x) => x !== f) })} />
            {f}
          </label>
        ))}
      </fieldset>
      <p className="text-xs text-warning">Modifier le prix ici ne change pas le prix facturé : crée un nouveau prix dans Stripe et colle son ID.</p>
      <Button type="submit" variant="brand" size="sm" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Enregistrer</Button>
    </form>
  );
}
