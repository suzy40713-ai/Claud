"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { PASSWORD_RULE, validateSignUp, type SignUpErrors } from "@/lib/validation/auth";

export function SignUpForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const result = validateSignUp(data);
    setErrors(result.errors);
    setFormError(null);
    if (!result.ok) return;

    startTransition(async () => {
      const { error } = await authClient.signUp.email({
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
        callbackURL: "/verifier-email/confirme",
      });
      if (error) {
        setFormError(authErrorMessage(error));
        return;
      }
      router.push(`/verifier-email?email=${encodeURIComponent(result.data.email)}`);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {formError ? <Alert variant="error">{formError}</Alert> : null}
      <Field id="name" label="Nom complet" error={errors.name}>
        <Input id="name" name="name" autoComplete="name" placeholder="Camille Martin" required />
      </Field>
      <Field id="email" label="Email professionnel" error={errors.email}>
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
      <Field id="password" label="Mot de passe" hint={PASSWORD_RULE} error={errors.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <Spinner /> : null}
        Créer mon compte
      </Button>
    </form>
  );
}
