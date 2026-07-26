import { createClient } from "@/lib/supabase/server";
import type {
  AdSpendRecord,
  MarginData,
  OrderRecord,
  PlatformFeeRecord,
  ReturnRecord,
} from "@/lib/margin/types";

/**
 * Fetches every order/return/ad_spend/platform_fee row for a store and
 * normalizes them for the pure functions in lib/margin/compute.ts.
 *
 * MVP scale (manual CSV import): fetching full history and filtering by
 * date range in JS keeps the query surface simple. Revisit with SQL-side
 * aggregation if a store's row counts grow large.
 */
export async function getMarginData(storeId: string): Promise<MarginData> {
  const supabase = await createClient();

  const [ordersRes, returnsRes, adSpendRes, feesRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, product_id, quantity, unit_sale_price, order_date, status, products(name, sku, cost_price)",
      )
      .eq("store_id", storeId),
    supabase
      .from("returns")
      .select("id, order_id, return_date, refunded_amount, orders!inner(store_id, product_id)")
      .eq("orders.store_id", storeId),
    supabase
      .from("ad_spend")
      .select("id, product_id, campaign_name, amount, period_start, period_end")
      .eq("store_id", storeId),
    supabase
      .from("platform_fees")
      .select("id, order_id, amount, period_start, period_end, orders(product_id, order_date)")
      .eq("store_id", storeId),
  ]);

  const orders: OrderRecord[] = (ordersRes.data ?? []).map((row) => ({
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    unitSalePrice: Number(row.unit_sale_price),
    orderDate: row.order_date,
    status: row.status,
    productName: row.products?.name ?? "Produit supprimé",
    productSku: row.products?.sku ?? "—",
    productCostPrice: Number(row.products?.cost_price ?? 0),
  }));

  const returns: ReturnRecord[] = (returnsRes.data ?? []).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    productId: row.orders?.product_id ?? null,
    returnDate: row.return_date,
    refundedAmount: Number(row.refunded_amount),
  }));

  const adSpend: AdSpendRecord[] = (adSpendRes.data ?? []).map((row) => ({
    id: row.id,
    productId: row.product_id,
    campaignName: row.campaign_name,
    amount: Number(row.amount),
    periodStart: row.period_start,
    periodEnd: row.period_end,
  }));

  const platformFees: PlatformFeeRecord[] = (feesRes.data ?? []).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    productId: row.orders?.product_id ?? null,
    amount: Number(row.amount),
    date: row.orders?.order_date ?? null,
    periodStart: row.period_start,
    periodEnd: row.period_end,
  }));

  return { orders, returns, adSpend, platformFees };
}
