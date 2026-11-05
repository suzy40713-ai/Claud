import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth-errors";
import { getSession, redirectToHome } from "@/server/auth/session";

export const metadata: Metadata = { title: "Confirmation de l'email" };

/**
 * Destination du lien de confirmation.
 * Succès : l'utilisateur est connecté automatiquement puis dirigé vers la création de son entreprise.
 * Échec : Better Auth ajoute `?error=CODE`.
 */
async function Result({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) {
    const session = await getSession();
    if (session) await redirectToHome(session.user.id);
    redirect("/connexion");
  }
  return (
    <div className="text-center sm:text-left">
      <span className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
        <AlertCircle className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Lien invalide</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">{authErrorMessage({ code: error })}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Connectez-vous : si votre adresse n&apos;est pas encore confirmée, un nouveau lien vous sera
        envoyé.
      </p>
      <Button asChild size="lg" className="mt-7 w-full">
        <Link href="/connexion">Se connecter</Link>
      </Button>
    </div>
  );
}

export default function ConfirmPage(props: PageProps<"/verifier-email/confirme">) {
  return (
    <Suspense>
      <Result searchParams={props.searchParams as Promise<{ error?: string }>} />
    </Suspense>
  );
}
