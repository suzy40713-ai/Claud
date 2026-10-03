import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/forms";
import { FormMessage } from "@/components/shared/form-message";
import { integrations } from "@/lib/env";
import { safeRedirectPath } from "@/lib/utils";

export const metadata = { title: "Connexion", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <AuthCard
      title="Bon retour 👋"
      description="Connecte-toi pour retrouver tes recherches et collections."
      footer={<>Pas encore de compte ? <Link href="/signup" className="text-foreground hover:underline">Créer un compte gratuit</Link></>}
    >
      {!integrations.supabase() && (
        <FormMessage type="info" className="mb-4">
          Configuration requise : l'authentification (Supabase) n'est pas encore configurée sur cette instance. Voir le README.
        </FormMessage>
      )}
      {sp.error && <FormMessage type="error" className="mb-4">Le lien est invalide ou a expiré. Réessaie.</FormMessage>}
      <LoginForm next={safeRedirectPath(sp.next, "/app")} />
    </AuthCard>
  );
}
