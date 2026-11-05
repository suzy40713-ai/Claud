"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Une erreur est survenue</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Nous n&apos;avons pas pu afficher cette page. Réessayez dans un instant.
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </main>
  );
}
