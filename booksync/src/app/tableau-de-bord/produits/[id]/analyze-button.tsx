"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScanSearch } from "lucide-react";
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
          if (!res.ok)
            return void toast.error(res.error, {
              action: res.limit ? (
                <Link href="/tableau-de-bord/abonnement" className="font-medium underline">
                  Voir les forfaits
                </Link>
              ) : undefined,
            });
          toast.success("Analyse terminée.");
          router.refresh();
        })
      }
    >
      <ScanSearch /> {pending ? "Analyse en cours…" : again ? "Mettre à jour l'analyse" : "Analyser mon produit"}
    </Button>
  );
}
