"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthHeading } from "@/components/auth/auth-heading";

/** Titre et bascule entre inscription particulier et professionnelle. */
export function SignUpHeading() {
  const pro = useSearchParams().get("pro") === "1";
  return (
    <>
      <AuthHeading
        title={pro ? "Créer votre espace professionnel" : "Créer votre compte"}
        description={
          pro
            ? "Gratuit, sans carte bancaire. Votre page de réservation est prête en quelques minutes."
            : "Gratuit. Réservez chez les professionnels et retrouvez tous vos rendez-vous au même endroit."
        }
      />
      <p className="-mt-3 mb-6 text-sm text-muted-foreground">
        {pro ? "Vous cherchez un professionnel ? " : "Vous êtes un professionnel ? "}
        <Link
          href={pro ? "/inscription" : "/inscription?pro=1"}
          className="font-medium text-primary hover:underline"
        >
          {pro ? "Créer un compte particulier" : "Créer votre espace professionnel"}
        </Link>
      </p>
    </>
  );
}
