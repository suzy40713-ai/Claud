"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { acceptOfferAction } from "./actions";

export function AcceptButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="lg"
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await acceptOfferAction(token);
          if (res.ok) router.push(`/rdv/${res.data.manageToken}?nouveau=1`);
          else {
            toast.error(res.error);
            router.refresh();
          }
        })
      }
    >
      {pending ? <Spinner /> : null}
      Réserver ce créneau
    </Button>
  );
}
