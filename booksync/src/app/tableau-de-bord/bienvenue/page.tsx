import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlan, PLANS } from "@/domain/billing/plans";
import { formatCents } from "@/lib/format";
import { can } from "@/domain/permissions";
import { requireOrg } from "@/server/auth/session";
import { confirmCheckout } from "@/server/billing/service";

export const metadata: Metadata = { title: "Bienvenue" };

type Search = { forfait?: string; session?: string };

async function Content({ searchParams }: { searchParams: Promise<Search> }) {
  let ctx = await requireOrg();
  const { forfait, session } = await searchParams;
  if (session && can(ctx.role, "billing.manage")) {
    await confirmCheckout(ctx, session).catch((e) => console.error("[stripe] confirmation", e));
    ctx = await requireOrg();
  }
  // Le webhook Stripe peut arriver quelques secondes après le retour du paiement.
  const bought = forfait && forfait in PLANS ? getPlan(forfait) : ctx.plan;
  const active = ctx.plan.id === bought.id;
  const price = formatCents(bought.priceCents);
  return (
    <div className="mx-auto grid w-full max-w-2xl gap-6 py-4" data-testid="welcome">
      <div className="text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Bienvenue dans {bought.name} !
        </h1>
        <p className="mt-2 text-muted-foreground">
          {active
            ? "Ton forfait est actif."
            : "Paiement reçu : ton forfait s'active dans quelques secondes."}
        </p>
      </div>
      <section className="rounded-2xl border bg-card p-6 shadow-xs">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Target className="size-5 text-primary" /> Ton objectif ce mois-ci : rentabiliser tes{" "}
          {price}
        </h2>
        <p className="mt-2 text-muted-foreground">
          Ton abonnement est ton premier investissement de business. Le but : que tes ventes du
          mois dépassent ce qu&apos;il te coûte. Ta jauge sur l&apos;accueil se remplit à chaque
          vente que tu notes.
        </p>
        <ol className="mt-4 grid list-decimal gap-2 pl-5">
          <li>Crée ta stratégie 30 jours (2 minutes).</li>
          <li>Lance l&apos;Autopilot et fais tes 3 actions du jour.</li>
          <li>Lis une leçon de l&apos;Académie par jour.</li>
          <li>Note chaque vente dans « Mes résultats ».</li>
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">
          Aucun résultat n&apos;est garanti : tout dépend des actions que tu mènes. BookSync te
          donne la méthode et les outils, à toi de jouer.
        </p>
      </section>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href="/tableau-de-bord/strategies">
            Créer ma stratégie <ArrowRight />
          </Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/tableau-de-bord">Aller à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}

export default function WelcomePage(props: PageProps<"/tableau-de-bord/bienvenue">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content searchParams={props.searchParams as Promise<Search>} />
    </Suspense>
  );
}
