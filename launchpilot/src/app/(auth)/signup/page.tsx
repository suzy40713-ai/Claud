"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export default function SignupPage() {
  const [state, formAction] = useFormState(signUp, initialState);

  return (
    <AuthShell
      title="Crée ton compte"
      description="Décris ton produit, on s'occupe du plan."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input id="fullName" name="fullName" placeholder="Alex Martin" autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="alex@produit.com" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="8 caractères minimum"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        {state.error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <SubmitButton variant="brand" className="w-full" size="lg">
          Créer mon plan gratuitement
        </SubmitButton>

        <p className="text-center text-xs text-muted-foreground">
          En créant un compte, tu acceptes nos conditions d'utilisation.
        </p>
      </form>
    </AuthShell>
  );
}
