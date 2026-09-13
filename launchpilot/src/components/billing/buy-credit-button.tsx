"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { purchasePlanCredit } from "@/lib/actions/billing";

export function BuyCreditButton({
  label = "Acheter un plan — 14,99€",
  returnTo,
  onDevModeSuccess,
  ...props
}: {
  label?: string;
  returnTo?: string;
  onDevModeSuccess?: () => void;
} & Omit<ButtonProps, "onClick" | "disabled">) {
  const [loading, setLoading] = React.useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await purchasePlanCredit(returnTo);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error || "Une erreur est survenue.");
      return;
    }
    if (result.url) {
      window.location.href = result.url;
      return;
    }
    if (result.devMode) {
      toast.success("Mode développement : 1 crédit ajouté à ton compte (Stripe n'est pas encore configuré).");
      if (onDevModeSuccess) {
        onDevModeSuccess();
      } else {
        window.location.reload();
      }
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} {...props}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {label}
    </Button>
  );
}
