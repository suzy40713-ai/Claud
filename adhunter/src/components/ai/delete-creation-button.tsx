"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteCreation } from "@/lib/actions/ai";

export function DeleteCreationButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Supprimer définitivement cette création ?")) return;
        start(async () => {
          const res = await deleteCreation(id);
          if (!res.ok) return void toast.error(res.error);
          toast.success("Création supprimée");
          router.push("/app/creator");
        });
      }}
    >
      <Trash2 /> Supprimer
    </Button>
  );
}
