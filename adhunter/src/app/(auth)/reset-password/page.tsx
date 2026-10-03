import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/forms";

export const metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choisis un nouveau mot de passe">
      <ResetPasswordForm />
    </AuthCard>
  );
}
