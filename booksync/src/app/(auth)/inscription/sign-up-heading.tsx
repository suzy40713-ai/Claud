"use client";

import { AuthHeading } from "@/components/auth/auth-heading";

/** Titre de l'inscription. */
export function SignUpHeading() {
  return (
    <AuthHeading
      title="Créez votre compte"
      description="Gratuit, sans carte bancaire. BookSync vous guide pas à pas, de l'idée à votre première vente."
    />
  );
}
