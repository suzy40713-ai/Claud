"use client";

import { useState, useTransition } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, safeRedirect } from "@/lib/auth-errors";
import { validateSignIn } from "@/lib/validation/auth";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const passwordReset = params.get("reinitialise") === "1";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateSignIn(Object.fromEntries(new FormData(event.currentTarget)));
    setErrors(result.errors);
    setFormError(null);
    if (!result.ok) return;

    startTransition(async () => {
      const { error } = await authClient.signIn.email({
        email: result.data.email,
        password: result.data.password,
      });
      if (error) {
        if (error.code === "EMAIL_NOT_VERIFIED") {
          router.push(`/verifier-email?email=${encodeURIComponent(result.data.email)}&renvoye=1`);
          return;
        }
        setFormError(authErrorMessage(error));
        return;
      }
      router.replace(safeRedirect(params.get("redirection")) as Route);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {passwordReset ? (
        <Alert variant="success">
          Votre mot de passe a été modifié. Vous pouvez vous connecter.
        </Alert>
      ) : null}
      {formError ? <Alert variant="error">{formError}</Alert> : null}
      <Field id="email" label="Email" error={errors.email}>
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
      <Field
        id="password"
        label="Mot de passe"
        error={errors.password}
        aside={
          <Link
            href="/mot-de-passe-oublie"
            className="text-[13px] font-medium text-primary hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        }
      >
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <Spinner /> : null}
        Se connecter
      </Button>
    </form>
  );
}
