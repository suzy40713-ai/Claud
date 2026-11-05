import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeading } from "@/components/auth/auth-heading";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeading
        title="Nouveau mot de passe"
        description="Choisissez un mot de passe que vous n'utilisez sur aucun autre site."
      />
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
