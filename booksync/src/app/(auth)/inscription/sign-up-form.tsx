"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { safeRedirect } from "@/lib/auth-errors";
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
  const params = useSearchParams();
  const presetEmail = params.get("email") ?? "";
  const redirection = safeRedirect(params.get("redirection"), "/verifier-email/confirme");
  const [terms, setTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const result = validateSignUp(data);
    setErrors(result.errors);
    setFormError(null);
    setTermsError(
      terms ? null : "Vous devez accepter les conditions générales pour créer un compte.",
    );
    if (!result.ok || !terms) return;

    startTransition(async () => {
      const { error } = await authClient.signUp.email({
        name: result.data.name,
        email: result.data.email,
        password: result.data.password,
        callbackURL: redirection,
        acceptTerms: true,
      } as Parameters<typeof authClient.signUp.email>[0]);
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
          defaultValue={presetEmail}
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
      <div className="grid gap-1.5">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="terms"
            checked={terms}
            onCheckedChange={(v) => setTerms(v === true)}
            aria-invalid={termsError ? true : undefined}
            aria-describedby={termsError ? "terms-error" : undefined}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-sm leading-snug text-muted-foreground">
            J&apos;accepte les{" "}
            <Link
              href="/conditions-generales"
              target="_blank"
              className="font-medium text-foreground underline underline-offset-2"
            >
              conditions générales
            </Link>{" "}
            et la{" "}
            <Link
              href="/confidentialite"
              target="_blank"
              className="font-medium text-foreground underline underline-offset-2"
            >
              politique de confidentialité
            </Link>
            .
          </label>
        </div>
        {termsError ? (
          <p id="terms-error" className="text-[13px] font-medium text-destructive">
            {termsError}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="lg" disabled={pending} className="mt-1 w-full">
        {pending ? <Spinner /> : null}
        Créer mon compte
      </Button>
    </form>
  );
}
