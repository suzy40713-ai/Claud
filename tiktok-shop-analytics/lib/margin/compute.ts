import { eachDayOfInterval, format, parseISO } from "date-fns";
import type {
  DateRange,
  GlobalMarginSummary,
  MarginData,
  MarginTimePoint,
  ProductMarginSummary,
} from "@/lib/margin/types";

function isWithin(date: string, range: DateRange): boolean {
  return date >= range.from && date <= range.to;
}

function overlaps(start: string, end: string, range: DateRange): boolean {
  return start <= range.to && end >= range.from;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function countedOrdersInRange(data: MarginData, range: DateRange) {
  return data.orders.filter(
    (o) => o.status !== "cancelled" && isWithin(o.orderDate, range),
  );
}

function adSpendInRange(data: MarginData, range: DateRange) {
  return data.adSpend.filter((a) => overlaps(a.periodStart, a.periodEnd, range));
}

function feesInRange(data: MarginData, range: DateRange) {
  return data.platformFees.filter((f) =>
    f.date
      ? isWithin(f.date, range)
      : f.periodStart && f.periodEnd
        ? overlaps(f.periodStart, f.periodEnd, range)
        : false,
  );
}

function returnsInRange(data: MarginData, range: DateRange) {
  return data.returns.filter((r) => isWithin(r.returnDate, range));
}

export function computeGlobalMargin(
  data: MarginData,
  range: DateRange,
): GlobalMarginSummary {
  const orders = countedOrdersInRange(data, range);
  const revenue = orders.reduce((sum, o) => sum + o.quantity * o.unitSalePrice, 0);
  const productCost = orders.reduce(
    (sum, o) => sum + o.quantity * o.productCostPrice,
    0,
  );
  const adSpend = adSpendInRange(data, range).reduce((sum, a) => sum + a.amount, 0);
  const platformFees = feesInRange(data, range).reduce((sum, f) => sum + f.amount, 0);
  const returns = returnsInRange(data, range).reduce(
    (sum, r) => sum + r.refundedAmount,
    0,
  );

  return {
    revenue: round2(revenue),
    productCost: round2(productCost),
    platformFees: round2(platformFees),
    adSpend: round2(adSpend),
    returns: round2(returns),
    netMargin: round2(revenue - productCost - platformFees - adSpend - returns),
    ordersCount: orders.length,
  };
}

export function computeProductMargins(
  data: MarginData,
  range: DateRange,
): ProductMarginSummary[] {
  const orders = countedOrdersInRange(data, range);
  const ads = adSpendInRange(data, range);
  const fees = feesInRange(data, range);
  const returns = returnsInRange(data, range);

  const byProduct = new Map<string, ProductMarginSummary>();

  function ensure(productId: string, name: string, sku: string) {
    let entry = byProduct.get(productId);
    if (!entry) {
      entry = {
        productId,
        name,
        sku,
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
      byProduct.set(productId, entry);
    }
    return entry;
  }

  const orderIdToProductId = new Map<string, string>();

  for (const order of orders) {
    const entry = ensure(order.productId, order.productName, order.productSku);
    entry.revenue += order.quantity * order.unitSalePrice;
    entry.productCost += order.quantity * order.productCostPrice;
    entry.unitsSold += order.quantity;
    entry.ordersCount += 1;
    orderIdToProductId.set(order.id, order.productId);
  }

  for (const ad of ads) {
    if (!ad.productId) continue;
    const entry = byProduct.get(ad.productId);
    if (entry) entry.adSpend += ad.amount;
  }

  for (const fee of fees) {
    if (!fee.productId) continue;
    const entry = byProduct.get(fee.productId);
    if (entry) entry.platformFees += fee.amount;
  }

  const returnedOrderIdsByProduct = new Map<string, Set<string>>();
  for (const ret of returns) {
    const productId = ret.productId ?? orderIdToProductId.get(ret.orderId);
    if (!productId) continue;
    const entry = byProduct.get(productId);
    if (!entry) continue;
    entry.returns += ret.refundedAmount;
    const set = returnedOrderIdsByProduct.get(productId) ?? new Set<string>();
    set.add(ret.orderId);
    returnedOrderIdsByProduct.set(productId, set);
  }

  const result = Array.from(byProduct.values()).map((entry) => {
    const returnedOrdersCount = returnedOrderIdsByProduct.get(entry.productId)?.size ?? 0;
    return {
      ...entry,
      revenue: round2(entry.revenue),
      productCost: round2(entry.productCost),
      adSpend: round2(entry.adSpend),
      platformFees: round2(entry.platformFees),
      returns: round2(entry.returns),
      netMargin: round2(
        entry.revenue - entry.productCost - entry.adSpend - entry.platformFees - entry.returns,
      ),
      returnedOrdersCount,
      returnRate: entry.ordersCount > 0 ? round2((returnedOrdersCount / entry.ordersCount) * 100) : 0,
    };
  });

  return result.sort((a, b) => b.netMargin - a.netMargin);
}

export function computeMarginTimeSeries(
  data: MarginData,
  range: DateRange,
  productId?: string,
): MarginTimePoint[] {
  const days = eachDayOfInterval({
    start: parseISO(range.from),
    end: parseISO(range.to),
  }).map((d) => format(d, "yyyy-MM-dd"));

  const buckets = new Map<string, { revenue: number; cost: number; ads: number; fees: number; returns: number }>();
  for (const day of days) {
    buckets.set(day, { revenue: 0, cost: 0, ads: 0, fees: 0, returns: 0 });
  }

  const orderIdToProductId = new Map<string, string>();
  for (const order of data.orders) orderIdToProductId.set(order.id, order.productId);

  const orders = countedOrdersInRange(data, range).filter(
    (o) => !productId || o.productId === productId,
  );
  const ads = adSpendInRange(data, range).filter(
    (a) => !productId || a.productId === productId,
  );
  const fees = feesInRange(data, range).filter(
    (f) => !productId || f.productId === productId,
  );
  const returns = returnsInRange(data, range).filter(
    (r) => !productId || (r.productId ?? orderIdToProductId.get(r.orderId)) === productId,
  );

  for (const order of orders) {
    const bucket = buckets.get(order.orderDate);
    if (!bucket) continue;
    bucket.revenue += order.quantity * order.unitSalePrice;
    bucket.cost += order.quantity * order.productCostPrice;
  }

  for (const ad of ads) {
    const bucketDate = ad.periodStart >= range.from ? ad.periodStart : range.from;
    const bucket = buckets.get(bucketDate);
    if (bucket) bucket.ads += ad.amount;
  }

  for (const fee of fees) {
    const feeDate = fee.date ?? fee.periodStart;
    if (!feeDate) continue;
    const bucketDate = feeDate >= range.from ? feeDate : range.from;
    const bucket = buckets.get(bucketDate);
    if (bucket) bucket.fees += fee.amount;
  }

  for (const ret of returns) {
    const bucket = buckets.get(ret.returnDate);
    if (bucket) bucket.returns += ret.refundedAmount;
  }

  return days.map((day) => {
    const b = buckets.get(day)!;
    return {
      date: day,
      revenue: round2(b.revenue),
      netMargin: round2(b.revenue - b.cost - b.ads - b.fees - b.returns),
    };
  });
}
