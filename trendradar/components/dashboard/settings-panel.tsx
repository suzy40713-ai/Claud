"use client";

import { useState } from "react";
import { PLANS } from "@/lib/plans";
import type { Profile } from "@/lib/supabase/types";

export function SettingsPanel({ profile }: { profile: Profile }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const plan = PLANS[profile.plan];

  async function handleUpgrade(target: "creator" | "pro") {
    setLoadingAction(target);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setLoadingAction(null);
    }
  }

  async function handlePortal() {
    setLoadingAction("portal");
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
      setLoadingAction(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Réglages & facturation</h1>
      <p className="mt-1 text-white/60">Gère ton plan et tes crédits.</p>

      <div className="glass-card mt-6 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">
              Plan actuel
            </p>
            <p className="text-2xl font-bold">{plan.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">
              Recherches restantes
            </p>
            <p className="text-2xl font-bold">
              {profile.search_credits} / {plan.searchCreditsPerMonth}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">
              Idées par recherche
            </p>
            <p className="text-2xl font-bold">{plan.ideasPerSearch}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">
              Renouvellement
            </p>
            <p className="text-sm font-medium">
              {new Date(profile.credits_reset_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>

        {profile.stripe_customer_id && (
          <button
            onClick={handlePortal}
            disabled={loadingAction === "portal"}
            className="mt-6 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium hover:bg-white/5 disabled:opacity-50"
          >
            {loadingAction === "portal" ? "Ouverture..." : "Gérer mon abonnement"}
          </button>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {(["creator", "pro"] as const)
          .filter((key) => key !== profile.plan)
          .map((key) => {
            const target = PLANS[key];
            return (
              <div key={key} className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-semibold">{target.name}</h3>
                <p className="mt-1 text-2xl font-extrabold">
                  {target.priceLabel}
                  <span className="text-sm font-normal text-white/50"> /mois</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {target.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="text-accent-light">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={loadingAction === key}
                  className="mt-6 w-full rounded-lg bg-accent-gradient px-4 py-2.5 text-sm font-semibold shadow-lg shadow-accent/20 transition hover:opacity-90 disabled:opacity-50"
                >
                  {loadingAction === key ? "Redirection..." : `Passer ${target.name}`}
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
