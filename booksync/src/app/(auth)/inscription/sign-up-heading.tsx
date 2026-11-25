"use client";

import { AuthHeading } from "@/components/auth/auth-heading";

/** Titre de l'inscription. */
export function SignUpHeading() {
  return (
    <AuthHeading
      title="Crée ton compte"
      description="Gratuit, sans carte bancaire. BookSync te guide pas à pas, de l'idée à ta première vente."
    />
  );
}
