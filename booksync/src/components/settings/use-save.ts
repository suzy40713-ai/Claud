"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Result = { ok: true; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Soumission d'un formulaire de paramètres : erreurs par champ, notification, rafraîchissement. */
export function useSave() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  function save(fn: () => Promise<Result>, onSuccess?: () => void) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setErrors({});
        toast.success(res.message ?? "Modifications enregistrées.");
        onSuccess?.();
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });
  }
  return { pending, errors, save };
}
