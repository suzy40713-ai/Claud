import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { getSession } from "@/server/auth/session";
import { AcceptTermsForm } from "./accept-terms-form";

export const metadata: Metadata = { title: "Conditions générales" };

async function Gate() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const firstName = session.user.name.split(/\s+/)[0];
  return (
    <>
      <span className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
        <FileCheck2 className="size-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight">Bienvenue {firstName}</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Avant de commencer, merci de prendre connaissance de nos conditions et de les accepter.
      </p>
      <AcceptTermsForm alreadyAccepted={Boolean(session.user.termsAcceptedAt)} />
    </>
  );
}

export default function AcceptTermsPage() {
  return (
    <Suspense>
      <Gate />
    </Suspense>
  );
}
