"use client";

import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { validateForgotPassword } from "@/lib/validation/auth";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateForgotPassword(Object.fromEntries(new FormData(event.currentTarget)));
    setError(result.errors.email ?? null);
    setFormError(null);
    if (!result.ok) return;
    startTransition(async () => {
      const { error } = await authClient.requestPasswordReset({
        email: result.data.email,
        redirectTo: "/reinitialiser-mot-de-passe",
      });
      if (error) {
        setFormError(authErrorMessage(error));
        return;
      }
      setSentTo(result.data.email);
    });
  }

  if (sentTo) {
    return (
      <Alert variant="success">
        Si un compte existe pour <strong className="font-medium break-all">{sentTo}</strong>, vous
        allez recevoir un lien de réinitialisation dans quelques instants. Il est valable 1 heure.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {formError ? <Alert variant="error">{formError}</Alert> : null}
      <Field id="email" label="Email" error={error}>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="vous@entreprise.fr"
          required
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Spinner /> : null}
        Envoyer le lien
      </Button>
    </form>
  );
}
