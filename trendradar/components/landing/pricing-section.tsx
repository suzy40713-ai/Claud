import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingSection({ standalone = false }: { standalone?: boolean }) {
  const tiers: { key: keyof typeof PLANS; highlighted?: boolean }[] = [
    { key: "free" },
    { key: "creator", highlighted: true },
    { key: "pro" },
  ];

  return (
    <section id="pricing" className={cn("mx-auto max-w-6xl px-6", standalone ? "py-16" : "py-24")}>
      {!standalone && (
        <>
          <h2 className="text-center text-3xl font-bold md:text-4xl">Tarifs simples</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-white/60">
            Commence gratuitement, passe à l'échelle quand tu es prêt.
          </p>
        </>
      )}
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {tiers.map(({ key, highlighted }) => {
          const plan = PLANS[key];
          return (
            <div
              key={key}
              className={cn(
                "relative flex flex-col rounded-2xl p-8",
                highlighted
                  ? "border-2 border-accent bg-surface shadow-2xl shadow-accent/20"
                  : "glass-card"
              )}
            >
              {highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent-gradient px-3 py-1 text-xs font-semibold">
                  Le plus populaire
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{plan.priceLabel}</span>
                {plan.priceCents > 0 && <span className="text-white/50">/mois</span>}
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="mt-0.5 text-accent-light">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={cn(
                  "mt-8 rounded-xl px-4 py-3 text-center text-sm font-semibold transition",
                  highlighted
                    ? "bg-accent-gradient hover:opacity-90"
                    : "border border-white/15 hover:bg-white/5"
                )}
              >
                {key === "free" ? "Commencer gratuitement" : `Choisir ${plan.name}`}
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
