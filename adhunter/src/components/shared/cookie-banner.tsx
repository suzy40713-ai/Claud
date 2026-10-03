"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const KEY = "adhunter-cookie-consent";

/**
 * AdHunter only uses strictly necessary cookies (session, security) and no
 * third-party analytics/advertising trackers. The banner informs users and
 * stores their choice; if optional trackers are ever added, gate them on
 * `localStorage[KEY] === "accepted"`.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!localStorage.getItem(KEY));
    } catch {
      setVisible(false);
    }
  }, []);

  function choose(value: "accepted" | "refused") {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      // storage unavailable — just hide
    }
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <div role="dialog" aria-live="polite" aria-label="Gestion des cookies" className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl animate-fade-in-up rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur sm:inset-x-auto sm:bottom-4 sm:left-4 sm:mx-0">
      <p className="text-sm text-muted-foreground">
        Nous utilisons uniquement des cookies strictement nécessaires au fonctionnement du service (connexion, sécurité).
        Aucun traceur publicitaire. <Link href="/legal/cookies" className="text-foreground underline underline-offset-4">En savoir plus</Link>
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => choose("refused")}>Continuer sans accepter</Button>
        <Button size="sm" onClick={() => choose("accepted")}>J'ai compris</Button>
      </div>
    </div>
  );
}
