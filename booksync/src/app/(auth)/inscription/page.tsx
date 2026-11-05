import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthHeading } from "@/components/auth/auth-heading";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { env } from "@/lib/env";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignUpPage() {
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  return (
    <>
      <AuthHeading
        title="Créer votre compte"
        description="Gratuit, sans carte bancaire. Votre page de réservation est prête en quelques minutes."
      />
      {googleEnabled ? (
        <>
          <GoogleButton redirectTo="/tableau-de-bord" />
          <OrDivider />
        </>
      ) : null}
      <Suspense>
        <SignUpForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
