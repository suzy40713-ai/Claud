"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { analyzeProductAction } from "../actions";

export function AnalyzeButton({ id, again }: { id: string; again: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      data-testid="analyze-product"
      disabled={pending}
      variant={again ? "secondary" : "primary"}
      onClick={() =>
        startTransition(async () => {
          const res = await analyzeProductAction(id);
          if (!res.ok) {
            if (res.limit)
              toast.error(res.error, {
                action: (
                  <Link href="/tableau-de-bord/abonnement" className="font-medium underline">
                    Voir les forfaits
                  </Link>
                ),
              });
            else toast.error(res.error);
            return;
          }
          toast.success(res.data.cached ? "Analyse déjà disponible (non décomptée)." : "Analyse terminée.");
          router.refresh();
        })
      }
    >
      <Sparkles /> {pending ? "Analyse en cours…" : again ? "Relancer l'analyse" : "Analyser avec l'IA"}
    </Button>
  );
}
