import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { StatCards } from "@/components/dashboard/StatCards";
import { MarginChart } from "@/components/dashboard/MarginChart";
import { OrderHistoryTable } from "@/components/products/OrderHistoryTable";
import { formatCurrency, formatPercent } from "@/lib/format";
import { resolveDateRange } from "@/lib/margin/date-range";
import { getMarginData } from "@/lib/margin/queries";
import { computeMarginTimeSeries, computeProductMargins } from "@/lib/margin/compute";

export const metadata: Metadata = {
  title: "Produit — TikTok Shop Analytics",
};

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string; preset?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, store_id, name, sku, sale_price, cost_price")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const { range, preset } = resolveDateRange(search);
  const marginData = await getMarginData(product.store_id);
  const productMargins = computeProductMargins(marginData, range);
  const summary = productMargins.find((p) => p.productId === product.id) ?? {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    revenue: 0,
    productCost: 0,
    adSpend: 0,
    platformFees: 0,
    returns: 0,
    netMargin: 0,
    unitsSold: 0,
    ordersCount: 0,
    returnedOrdersCount: 0,
    returnRate: 0,
  };
  const timeSeries = computeMarginTimeSeries(marginData, range, product.id);
  const productOrders = marginData.orders.filter(
    (o) => o.productId === product.id && o.orderDate >= range.from && o.orderDate <= range.to,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          SKU {product.sku} · Prix catalogue {formatCurrency(Number(product.sale_price))} ·
          Coût de revient {formatCurrency(Number(product.cost_price))}
        </p>
      </div>

      <DateRangePicker activePreset={preset} range={range} />

      <StatCards summary={summary} />

      <div className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-600">
        <span className="font-medium text-neutral-900">
          {summary.unitsSold} unité(s) vendue(s)
        </span>{" "}
        sur {summary.ordersCount} commande(s) · taux de retour{" "}
        <span
          className={
            summary.returnRate > 15
              ? "font-medium text-red-600"
              : summary.returnRate > 5
                ? "font-medium text-amber-600"
                : "font-medium text-neutral-900"
          }
        >
          {formatPercent(summary.returnRate)}
        </span>{" "}
        ({summary.returnedOrdersCount} commande(s) retournée(s))
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Tendance de la marge
        </h2>
        <MarginChart data={timeSeries} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Historique des ventes
        </h2>
        <OrderHistoryTable orders={productOrders} />
      </div>
    </div>
  );
}
