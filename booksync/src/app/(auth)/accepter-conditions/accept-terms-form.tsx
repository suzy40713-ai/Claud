"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { acceptTermsAction } from "./actions";

export function AcceptTermsForm({ alreadyAccepted }: { alreadyAccepted: boolean }) {
  const params = useSearchParams();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const redirection = params.get("redirection");

  useEffect(() => {
    if (alreadyAccepted) startTransition(() => acceptTermsAction(true, redirection).then(() => undefined));
  }, [alreadyAccepted, redirection]);

  return (
    <div className="mt-7 grid gap-5">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className="flex items-start gap-2.5">
        <Checkbox id="terms" checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
        <label htmlFor="terms" className="text-sm leading-snug text-muted-foreground">
          J&apos;accepte les{" "}
          <Link href="/conditions-generales" target="_blank" className="font-medium text-foreground underline underline-offset-2">
            conditions générales
          </Link>{" "}
          et la{" "}
          <Link href="/confidentialite" target="_blank" className="font-medium text-foreground underline underline-offset-2">
            politique de confidentialité
          </Link>
          .
        </label>
      </div>
      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await acceptTermsAction(checked, redirection);
            if (res && !res.ok) setError(res.error);
          })
        }
      >
        {pending ? <Spinner /> : null}
        Continuer
      </Button>
    </div>
  );
}
