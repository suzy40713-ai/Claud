"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Check, Loader2 } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { generatePlanForProduct } from "@/lib/actions/generation";

const MESSAGES = [
  "Analyse de ton produit...",
  "Identification de ton client cible...",
  "Construction de ta stratégie...",
  "Rédaction de ton contenu et de tes emails...",
  "Génération de ton plan d'action sur 30 jours...",
];

export default function GeneratingPage() {
  return (
    <Suspense>
      <GeneratingFlow />
    </Suspense>
  );
}

function GeneratingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [messageIndex, setMessageIndex] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const startedRef = React.useRef(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (!productId || startedRef.current) return;
    startedRef.current = true;

    generatePlanForProduct(productId).then((result) => {
      if (result.success && result.reportId) {
        setDone(true);
        setTimeout(() => router.push(`/dashboard/rapports/${result.reportId}`), 900);
      } else {
        setError(result.error || "Une erreur est survenue pendant la génération.");
      }
    });
  }, [productId, router]);

  if (!productId) {
    return (
      <Centered>
        <p className="text-muted-foreground">Aucun produit à analyser. Reprends l'onboarding.</p>
        <Button className="mt-4" onClick={() => router.push("/onboarding")}>
          Retour à l'onboarding
        </Button>
      </Centered>
    );
  }

  if (error) {
    return (
      <Centered>
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Retour au dashboard
            </Button>
            <Button
              variant="brand"
              onClick={() => {
                setError(null);
                startedRef.current = false;
                setMessageIndex(0);
              }}
            >
              Réessayer
            </Button>
          </div>
        </div>
      </Centered>
    );
  }

  return (
    <Centered>
      <div className="flex flex-col items-center gap-8">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-pulse-soft rounded-full bg-brand-gradient opacity-20 blur-xl" />
          {done ? (
            <Check className="h-10 w-10 text-success" />
          ) : (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          )}
        </div>

        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">{done ? "Ton plan est prêt !" : MESSAGES[messageIndex]}</p>
          <p className="text-sm text-muted-foreground">Ça prend généralement moins d'une minute.</p>
        </div>

        <div className="flex flex-col gap-2">
          {MESSAGES.map((msg, i) => (
            <div
              key={msg}
              className={`flex items-center gap-2 text-sm transition-opacity ${
                i <= messageIndex ? "opacity-100" : "opacity-30"
              }`}
            >
              {i < messageIndex || done ? (
                <Check className="h-3.5 w-3.5 text-success" />
              ) : i === messageIndex ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border border-border" />
              )}
              <span className={i <= messageIndex ? "text-foreground" : "text-muted-foreground"}>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-grid-fade bg-background px-4">
      <Logo />
      {children}
    </div>
  );
}
