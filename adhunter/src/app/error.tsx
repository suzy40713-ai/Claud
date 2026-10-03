"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold">Oups, quelque chose s'est mal passé</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Une erreur inattendue est survenue. Réessaie ; si le problème persiste, contacte-nous{error.digest ? ` en indiquant le code ${error.digest}` : ""}.
      </p>
      <Button variant="brand" onClick={reset}>Réessayer</Button>
    </div>
  );
}
