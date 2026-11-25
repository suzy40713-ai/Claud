import type { Metadata } from "next";
import { IdeaPicker } from "@/components/launch/idea-picker";

export const metadata: Metadata = {
  title: "Quoi vendre quand on débute ? Trouvez votre idée en 2 minutes",
  description:
    "Aide numérique, montage vidéo, modèles Canva, revente Vinted, cours en visio… Trouvez quoi vendre à partir de ce que vous savez déjà faire, avec un prix de départ et vos 3 premières actions. Gratuit.",
  alternates: { canonical: "/lancer-mon-activite" },
};

export default function LaunchPage() {
  return (
    <main className="overflow-x-clip">
      <section className="mx-auto w-full max-w-4xl px-4 pt-14 pb-10 text-center sm:px-6 sm:pt-20">
        <p className="text-sm font-semibold tracking-wide text-primary">Gratuit · 2 minutes</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance sm:text-6xl">
          Trouvez quoi vendre.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-pretty text-muted-foreground">
          Vous voulez gagner vos premiers euros mais vous ne savez pas par où commencer ? Choisissez ce que
          vous savez déjà faire : on vous propose une idée, un prix de départ et vos 3 premières
          actions.
        </p>
      </section>
      <section className="mx-auto w-full max-w-4xl px-4 pb-24 sm:px-6">
        <IdeaPicker mode="public" />
      </section>
    </main>
  );
}
