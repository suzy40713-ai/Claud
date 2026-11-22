import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { ACTIVITIES } from "@/domain/activities";
import { env } from "@/lib/env";
import { listMemberships, requireSession } from "@/server/auth/session";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Créer votre entreprise" };

async function Gate({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireSession();
  if ((await listMemberships(session.user.id)).length > 0) {
    redirect("/tableau-de-bord");
  }
  const firstName = session.user.name.split(/\s+/)[0];
  const sp = await searchParams;
  const nom = typeof sp.nom === "string" ? sp.nom.trim().slice(0, 60) : "";
  const activite = typeof sp.activite === "string" ? sp.activite : "";
  return (
    <>
      <p className="text-sm font-medium text-primary">Bienvenue {firstName} 👋</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Présentez votre entreprise</h1>
      <p className="mt-2 mb-7 text-[15px] text-muted-foreground">
        Ces informations apparaîtront sur votre page de réservation. Vous pourrez les modifier plus
        tard.
      </p>
      <OnboardingForm
        publicBaseUrl={env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, "")}
        initial={{
          name: nom || undefined,
          activity: ACTIVITIES.some((a) => a.value === activite) ? activite : undefined,
        }}
      />
    </>
  );
}

export default function OnboardingPage(props: PageProps<"/onboarding">) {
  return (
    <div className="flex min-h-dvh flex-col bg-background sm:bg-subtle">
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:flex sm:justify-center sm:pt-14">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col px-5 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:items-center">
        <div className="w-full sm:max-w-[480px] sm:rounded-2xl sm:border sm:bg-card sm:p-8 sm:shadow-md">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
            <Gate searchParams={props.searchParams} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
