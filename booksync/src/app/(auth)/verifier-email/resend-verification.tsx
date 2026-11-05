"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function ResendVerification() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(
    params.get("renvoye") === "1"
      ? {
          kind: "success",
          text: "Votre adresse n'est pas encore confirmée : nous venons de vous renvoyer le lien.",
        }
      : null,
  );

  function resend() {
    startTransition(async () => {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verifier-email/confirme",
      });
      setStatus(
        error
          ? { kind: "error", text: authErrorMessage(error) }
          : { kind: "success", text: "Un nouveau lien vient de vous être envoyé." },
      );
    });
  }

  return (
    <>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Nous avons envoyé un lien de confirmation
        {email ? (
          <>
            {" "}
            à <strong className="font-medium break-all text-foreground">{email}</strong>
          </>
        ) : null}
        . Cliquez dessus pour activer votre compte.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Pensez à vérifier vos courriers indésirables.
      </p>
      {status ? (
        <Alert variant={status.kind} className="mt-6 text-left">
          {status.text}
        </Alert>
      ) : null}
      <div className="mt-7 grid gap-3">
        {email ? (
          <Button
            variant="secondary"
            size="lg"
            onClick={resend}
            disabled={pending}
            className="w-full"
          >
            {pending ? <Spinner /> : null}
            Renvoyer le lien
          </Button>
        ) : null}
        <Button asChild variant="ghost" size="lg" className="w-full">
          <Link href="/connexion">Retour à la connexion</Link>
        </Button>
      </div>
    </>
  );
}
