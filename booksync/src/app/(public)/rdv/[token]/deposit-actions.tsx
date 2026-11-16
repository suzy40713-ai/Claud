"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { abandonDepositAction, resumeDepositAction } from "./actions";

export function DepositActions({ token, bookingUrl }: { token: string; bookingUrl: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="grid gap-2">
      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await resumeDepositAction(token);
            if (res.ok) window.location.assign(res.data.url);
            else {
              toast.error(res.error);
              router.refresh();
            }
          })
        }
      >
        {pending ? <Spinner /> : <CreditCard />}
        Payer l&apos;acompte
      </Button>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await abandonDepositAction(token);
            if (res.ok) {
              toast.success(res.message);
              router.push(bookingUrl as Route);
            } else toast.error(res.error);
          })
        }
      >
        Abandonner la réservation
      </Button>
    </div>
  );
}
