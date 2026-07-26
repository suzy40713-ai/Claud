import { formatCurrency, formatDate } from "@/lib/format";
import type { OrderRecord } from "@/lib/margin/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  completed: "Complétée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export function OrderHistoryTable({ orders }: { orders: OrderRecord[] }) {
  if (orders.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 p-6 text-sm text-neutral-500">
        Aucune commande sur cette période.
      </p>
    );
  }

  const sorted = [...orders].sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1));

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Quantité</th>
            <th className="px-4 py-3">Prix unitaire</th>
            <th className="px-4 py-3">Coût unitaire</th>
            <th className="px-4 py-3">CA</th>
            <th className="px-4 py-3">Marge brute</th>
            <th className="px-4 py-3">Statut</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((order) => {
            const revenue = order.quantity * order.unitSalePrice;
            const grossMargin = revenue - order.quantity * order.productCostPrice;
            return (
              <tr key={order.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 text-neutral-700">{formatDate(order.orderDate)}</td>
                <td className="px-4 py-3 text-neutral-700">{order.quantity}</td>
                <td className="px-4 py-3 text-neutral-700">
                  {formatCurrency(order.unitSalePrice)}
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {formatCurrency(order.productCostPrice)}
                </td>
                <td className="px-4 py-3 text-neutral-700">{formatCurrency(revenue)}</td>
                <td
                  className={`px-4 py-3 font-medium ${
                    grossMargin < 0 ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {formatCurrency(grossMargin)}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {STATUS_LABELS[order.status] ?? order.status}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
