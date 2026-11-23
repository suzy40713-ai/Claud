"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "../actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            `Supprimer « ${name} » ? Ses analyses et contenus seront aussi supprimés.`,
          )
        )
          return;
        startTransition(async () => {
          const res = await deleteProductAction(id);
          if (!res.ok) return void toast.error(res.error);
          toast.success("Produit supprimé.");
          router.push("/tableau-de-bord/produits");
          router.refresh();
        });
      }}
    >
      <Trash2 /> Supprimer
    </Button>
  );
}
