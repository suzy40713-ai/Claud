import { formatCurrency } from "@/lib/format";
import type { GlobalMarginSummary } from "@/lib/margin/types";

export function StatCards({ summary }: { summary: GlobalMarginSummary }) {
  const cards = [
    { label: "Marge nette réelle", value: summary.netMargin, emphasis: true },
    { label: "Chiffre d'affaires", value: summary.revenue },
    { label: "Coût produits", value: -summary.productCost },
    { label: "Frais de plateforme", value: -summary.platformFees },
    { label: "Dépenses publicitaires", value: -summary.adSpend },
    { label: "Retours remboursés", value: -summary.returns },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-lg border p-4 ${
            card.emphasis ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200"
          }`}
        >
          <p className={`text-xs ${card.emphasis ? "text-neutral-300" : "text-neutral-500"}`}>
            {card.label}
          </p>
          <p
            className={`mt-1 text-lg font-semibold ${
              card.emphasis
                ? "text-white"
                : card.value < 0
                  ? "text-red-600"
                  : "text-neutral-900"
            }`}
          >
            {formatCurrency(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
