"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { PASSWORD_RULE, validateResetPassword } from "@/lib/validation/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || linkError) {
    return (
      <div className="grid gap-5">
        <Alert variant="error">{authErrorMessage({ code: linkError ?? "INVALID_TOKEN" })}</Alert>
        <Button asChild size="lg" className="w-full">
          <Link href="/mot-de-passe-oublie">Demander un nouveau lien</Link>
        </Button>
      </div>
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateResetPassword(Object.fromEntries(new FormData(event.currentTarget)));
    setErrors(result.errors);
    setFormError(null);
    if (!result.ok || !token) return;
    startTransition(async () => {
      const { error } = await authClient.resetPassword({
        newPassword: result.data.password,
        token,
      });
      if (error) {
        setFormError(authErrorMessage(error));
        return;
      }
      router.replace("/connexion?reinitialise=1");
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {formError ? <Alert variant="error">{formError}</Alert> : null}
      <Field
        id="password"
        label="Nouveau mot de passe"
        hint={PASSWORD_RULE}
        error={errors.password}
      >
        <PasswordInput id="password" name="password" autoComplete="new-password" required />
      </Field>
      <Field id="confirm" label="Confirmer le mot de passe" error={errors.confirm}>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Spinner /> : null}
        Enregistrer le mot de passe
      </Button>
    </form>
  );
}
