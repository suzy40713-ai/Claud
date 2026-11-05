import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-heading";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Connexion" };

export default function SignInPage() {
  return (
    <>
      <AuthHeading
        title="Bon retour parmi nous"
        description="Connectez-vous à votre espace BookSync."
      />
      <Suspense>
        <SignInForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </>
  );
}
