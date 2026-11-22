import type { Metadata } from "next";
import { LaunchTool } from "./launch-tool";

export const metadata: Metadata = {
  title: "Lance ton activité beauté : nom, prix, bio et plan en 2 minutes",
  description:
    "Ongles, tresses, cils, coaching, cours ou freelance en ligne : trouve le nom de ton activité, tes prix de départ, ta bio Instagram et ton plan de lancement sur 7 jours. Gratuit.",
  alternates: { canonical: "/lancer-mon-activite" },
};

export default function LaunchPage() {
  return (
    <main className="overflow-x-clip">
      <section className="mx-auto w-full max-w-5xl px-4 pt-14 pb-10 text-center sm:px-6 sm:pt-20">
        <p className="text-sm font-semibold tracking-wide text-primary">Gratuit · 2 minutes</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
          Lance ton activité.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
          Ongles, tresses, cils, coaching, cours ou freelance en ligne… Réponds à 5 questions : on
          te prépare ton nom, tes prix, ta bio et ton plan pour trouver tes premières clientes.
        </p>
      </section>
      <section className="mx-auto w-full max-w-5xl px-4 pb-24 sm:px-6">
        <LaunchTool />
      </section>
    </main>
  );
}
