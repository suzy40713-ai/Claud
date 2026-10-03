"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormMessage } from "@/components/shared/form-message";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, signIn, signUp, updatePassword, type AuthActionState } from "@/lib/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthActionState, FormData>(signIn, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/app"} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Mot de passe</Label>
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Mot de passe oublié ?</Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      <SubmitButton className="w-full" pendingText="Connexion…">Se connecter</SubmitButton>
    </form>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthActionState, FormData>(signUp, {});
  if (state.success) return <FormMessage type="success">{state.success}</FormMessage>;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/app"} />
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom (facultatif)</Label>
        <Input id="fullName" name="fullName" autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required aria-describedby="pw-help" />
        <p id="pw-help" className="text-xs text-muted-foreground">8 caractères minimum.</p>
      </div>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="terms" required className="mt-1 accent-[#7657FF]" />
        <span>
          J'accepte les <Link href="/legal/cgu" target="_blank" className="text-foreground underline underline-offset-4">CGU</Link> et la{" "}
          <Link href="/legal/confidentialite" target="_blank" className="text-foreground underline underline-offset-4">politique de confidentialité</Link>.
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="marketing" className="mt-1 accent-[#7657FF]" />
        <span>Je souhaite recevoir des conseils et nouveautés par email (facultatif, désinscription à tout moment).</span>
      </label>
      {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      <SubmitButton className="w-full" pendingText="Création du compte…">Créer mon compte gratuit</SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<AuthActionState, FormData>(requestPasswordReset, {});
  if (state.success) return <FormMessage type="success">{state.success}</FormMessage>;
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </div>
      {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      <SubmitButton className="w-full" pendingText="Envoi…">Envoyer le lien</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState<AuthActionState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Nouveau mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && <FormMessage type="error">{state.error}</FormMessage>}
      <SubmitButton className="w-full" pendingText="Enregistrement…">Mettre à jour</SubmitButton>
    </form>
  );
}
