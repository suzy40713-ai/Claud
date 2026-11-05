"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllReadAction } from "./actions";

export function MarkAllRead() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(async () => (await markAllReadAction(), router.refresh()))}
    >
      <CheckCheck /> Tout marquer comme lu
    </Button>
  );
}
