import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { ProductMarginSummary } from "@/lib/margin/types";

export function ProductMarginTable({ products }: { products: ProductMarginSummary[] }) {
  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-neutral-200 p-6 text-sm text-neutral-500">
        Aucune commande sur cette période.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
          <tr>
            <th className="px-4 py-3">Produit</th>
            <th className="px-4 py-3">Unités vendues</th>
            <th className="px-4 py-3">CA</th>
            <th className="px-4 py-3">Coût produit</th>
            <th className="px-4 py-3">Pub</th>
            <th className="px-4 py-3">Frais</th>
            <th className="px-4 py-3">Retours</th>
            <th className="px-4 py-3">Taux de retour</th>
            <th className="px-4 py-3">Marge nette</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.productId} className="border-t border-neutral-100">
              <td className="px-4 py-3">
                <Link
                  href={`/products/${product.productId}`}
                  className="font-medium text-neutral-900 underline underline-offset-2"
                >
                  {product.name}
                </Link>
                <p className="text-xs text-neutral-500">{product.sku}</p>
              </td>
              <td className="px-4 py-3 text-neutral-700">{product.unitsSold}</td>
              <td className="px-4 py-3 text-neutral-700">{formatCurrency(product.revenue)}</td>
              <td className="px-4 py-3 text-neutral-700">{formatCurrency(product.productCost)}</td>
              <td className="px-4 py-3 text-neutral-700">{formatCurrency(product.adSpend)}</td>
              <td className="px-4 py-3 text-neutral-700">{formatCurrency(product.platformFees)}</td>
              <td className="px-4 py-3 text-neutral-700">{formatCurrency(product.returns)}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    product.returnRate > 15
                      ? "font-medium text-red-600"
                      : product.returnRate > 5
                        ? "font-medium text-amber-600"
                        : "text-neutral-700"
                  }
                >
                  {formatPercent(product.returnRate)}
                </span>
              </td>
              <td
                className={`px-4 py-3 font-semibold ${
                  product.netMargin < 0 ? "text-red-600" : "text-green-700"
                }`}
              >
                {formatCurrency(product.netMargin)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
