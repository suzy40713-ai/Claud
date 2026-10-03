import { Pricing } from "@/components/marketing/pricing";
import { Faq, SectionHeading } from "@/components/marketing/sections";
import { getPublicPlans } from "@/lib/public-plans";
import { DEFAULT_PLANS, PLAN_ORDER } from "@/lib/plans";
import { Check, Minus } from "lucide-react";

export const revalidate = 3600;

export const metadata = {
  title: "Tarifs",
  description: "Formules AdHunter : Free (0 €), Pro (19,99 €/mois) et Business (49,99 €/mois). Sans engagement, résiliable à tout moment.",
  alternates: { canonical: "/tarifs" },
};

function cell(v: number | boolean) {
  if (typeof v === "boolean") return v ? <Check className="mx-auto h-4 w-4 text-violet-400" aria-label="Inclus" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground" aria-label="Non inclus" />;
  if (v < 0) return "Illimité";
  if (v === 0) return <Minus className="mx-auto h-4 w-4 text-muted-foreground" aria-label="Non inclus" />;
  return v.toLocaleString("fr-FR");
}

export default async function PricingPage() {
  const plans = await getPublicPlans();
  const rows: { label: string; get: (id: (typeof PLAN_ORDER)[number]) => number | boolean }[] = [
    { label: "Recherches / mois", get: (id) => plans[id].limits.searches_per_month },
    { label: "Résultats par recherche", get: (id) => plans[id].limits.results_per_search },
    { label: "Analyses IA / mois", get: (id) => plans[id].limits.ai_analyses_per_month },
    { label: "Générations Ad Creator / mois", get: (id) => plans[id].limits.ai_creations_per_month },
    { label: "Collections", get: (id) => plans[id].limits.collections_max },
    { label: "Favoris et notes", get: () => true },
    { label: "Historique des recherches", get: (id) => plans[id].features.includes("search_history") },
    { label: "Trend Radar", get: (id) => plans[id].features.includes("trend_radar") },
    { label: "Recherche avancée", get: (id) => plans[id].features.includes("advanced_search") },
    { label: "Espace équipe", get: (id) => plans[id].features.includes("teams") },
    { label: "Exports / mois", get: (id) => plans[id].limits.exports_per_month },
  ];

  return (
    <>
      <section className="container pt-20 text-center">
        <h1 className="text-balance text-4xl font-semibold sm:text-5xl">Des tarifs simples et transparents</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Commence gratuitement, évolue quand tu es prêt. Sans engagement.</p>
      </section>
      <Pricing plans={plans} heading={false} />
      <section className="container pb-12">
        <SectionHeading eyebrow="Comparatif" title="Comparer les formules" />
        <div className="mt-10 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-card">
              <tr>
                <th scope="col" className="p-4 text-left font-medium">Fonctionnalité</th>
                {PLAN_ORDER.map((id) => (
                  <th key={id} scope="col" className="p-4 text-center font-medium">{DEFAULT_PLANS[id].name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <th scope="row" className="p-4 text-left font-normal text-muted-foreground">{r.label}</th>
                  {PLAN_ORDER.map((id) => (
                    <td key={id} className="p-4 text-center">{cell(r.get(id))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Faq />
    </>
  );
}
