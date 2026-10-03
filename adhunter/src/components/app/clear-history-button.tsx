"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { clearSearchHistory } from "@/lib/actions/ads";

export function ClearHistoryButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Effacer tout ton historique de recherches ?")) return;
        start(async () => {
          const res = await clearSearchHistory();
          if (!res.ok) return void toast.error(res.error);
          toast.success("Historique effacé");
          router.refresh();
        });
      }}
    >
      <Trash2 /> Effacer l'historique
    </Button>
  );
}
