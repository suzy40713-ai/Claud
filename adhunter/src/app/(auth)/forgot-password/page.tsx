import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forms";

export const metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Mot de passe oublié"
      description="Indique ton email : nous t'envoyons un lien pour choisir un nouveau mot de passe."
      footer={<Link href="/login" className="hover:text-foreground">Retour à la connexion</Link>}
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
