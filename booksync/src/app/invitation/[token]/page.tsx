import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { AlertCircle, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/domain/permissions";
import { getSession } from "@/server/auth/session";
import { getInvitationByToken } from "@/server/team/service";
import { InvitationActions } from "./invitation-actions";

export const metadata: Metadata = { title: "Invitation", robots: { index: false } };

async function InvitationContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invitation, session] = await Promise.all([getInvitationByToken(token), getSession()]);

  if (!invitation || invitation.status !== "pending") {
    const message =
      invitation?.status === "expired"
        ? "Cette invitation a expiré. Demandez à la personne qui vous a invité de vous en envoyer une nouvelle."
        : invitation?.status === "accepted"
          ? "Cette invitation a déjà été acceptée."
          : "Ce lien d'invitation n'est pas valide ou a été annulé.";
    return (
      <>
        <span className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
          <AlertCircle className="size-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Invitation indisponible</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">{message}</p>
        <Button asChild size="lg" variant="secondary" className="mt-7 w-full">
          <Link href={session ? "/tableau-de-bord" : "/connexion"}>Continuer</Link>
        </Button>
      </>
    );
  }

  const returnTo = `/invitation/${token}`;
  const sameEmail = session?.user.email.toLowerCase() === invitation.email.toLowerCase();
  return (
    <>
      <span className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
        <Users className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Rejoindre {invitation.organizationName}</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        {invitation.inviterName} vous invite à rejoindre l&apos;équipe en tant que{" "}
        <strong className="font-medium text-foreground">{ROLE_LABELS[invitation.role].toLowerCase()}</strong>.
      </p>
      <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm break-all">{invitation.email}</p>

      {session && sameEmail ? (
        <InvitationActions token={token} />
      ) : session ? (
        <div className="mt-6 grid gap-3">
          <p className="text-sm text-muted-foreground">
            Vous êtes connecté avec <strong className="text-foreground">{session.user.email}</strong>. Cette invitation est
            destinée à une autre adresse.
          </p>
          <InvitationActions token={token} signOutOnly />
        </div>
      ) : (
        <div className="mt-7 grid gap-3">
          <Button asChild size="lg" className="w-full">
            <Link
              href={`/inscription?email=${encodeURIComponent(invitation.email)}&redirection=${encodeURIComponent(returnTo)}` as Route}
            >
              Créer mon compte
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="w-full">
            <Link href={`/connexion?redirection=${encodeURIComponent(returnTo)}` as Route}>J&apos;ai déjà un compte</Link>
          </Button>
        </div>
      )}
    </>
  );
}

export default function InvitationPage(props: PageProps<"/invitation/[token]">) {
  return (
    <div className="flex min-h-dvh flex-col bg-background sm:bg-subtle">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:flex sm:justify-center sm:pt-14">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col px-5 pt-8 pb-10 sm:items-center">
        <div className="w-full sm:max-w-[440px] sm:rounded-2xl sm:border sm:bg-card sm:p-8 sm:shadow-md">
          <Suspense fallback={<Skeleton className="h-72" />}>
            <InvitationContent params={props.params} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
