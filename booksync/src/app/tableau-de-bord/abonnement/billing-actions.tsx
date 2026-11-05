"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cancelSubscriptionAction, portalAction, subscribeAction } from "./actions";

export function PlanButton({
  plan,
  label,
  disabled,
}: {
  plan: "starter" | "pro";
  label: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      className="w-full"
      variant={plan === "pro" ? "primary" : "secondary"}
      disabled={disabled || pending}
      onClick={() =>
        startTransition(async () => {
          const res = await subscribeAction(plan);
          if (!res.ok) return void toast.error(res.error);
          if ("url" in res.data) window.location.href = res.data.url;
          else {
            toast.success("Forfait modifié.");
            router.refresh();
          }
        })
      }
    >
      {pending ? <Spinner /> : null}
      {label}
    </Button>
  );
}

export function BillingActions({
  hasSubscription,
  cancelAtPeriodEnd,
  hasCustomer,
}: {
  hasSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {hasCustomer ? (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await portalAction();
              if (!res.ok) return void toast.error(res.error);
              window.location.href = res.data;
            })
          }
        >
          <CreditCard /> Moyen de paiement et factures
        </Button>
      ) : null}
      {hasSubscription ? (
        <Button
          variant={cancelAtPeriodEnd ? "primary" : "ghost"}
          className={cancelAtPeriodEnd ? "" : "text-destructive"}
          disabled={pending}
          onClick={() => {
            if (
              !cancelAtPeriodEnd &&
              !confirm(
                "Résilier votre abonnement ? Il restera actif jusqu'à la fin de la période payée, puis votre compte repassera au forfait Free.",
              )
            )
              return;
            startTransition(async () => {
              const res = await cancelSubscriptionAction(!cancelAtPeriodEnd);
              if (res.ok) toast.success(res.message);
              else toast.error(res.error);
              router.refresh();
            });
          }}
        >
          {pending ? <Spinner /> : null}
          {cancelAtPeriodEnd ? "Reprendre mon abonnement" : "Résilier"}
        </Button>
      ) : null}
    </div>
  );
}
