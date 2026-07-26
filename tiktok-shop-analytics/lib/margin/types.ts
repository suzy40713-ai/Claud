import type { OrderStatus } from "@/types/database";

export interface OrderRecord {
  id: string;
  productId: string;
  quantity: number;
  unitSalePrice: number;
  orderDate: string;
  status: OrderStatus;
  productName: string;
  productSku: string;
  productCostPrice: number;
}

export interface ReturnRecord {
  id: string;
  orderId: string;
  productId: string | null;
  returnDate: string;
  refundedAmount: number;
}

export interface AdSpendRecord {
  id: string;
  productId: string | null;
  campaignName: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
}

export interface PlatformFeeRecord {
  id: string;
  orderId: string | null;
  productId: string | null;
  amount: number;
  /** Single date to bucket this fee by, when tied to an order. */
  date: string | null;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface MarginData {
  orders: OrderRecord[];
  returns: ReturnRecord[];
  adSpend: AdSpendRecord[];
  platformFees: PlatformFeeRecord[];
}

export interface DateRange {
  from: string;
  to: string;
}

export interface GlobalMarginSummary {
  revenue: number;
  productCost: number;
  platformFees: number;
  adSpend: number;
  returns: number;
  netMargin: number;
  ordersCount: number;
}

export interface ProductMarginSummary {
  productId: string;
  name: string;
  sku: string;
  revenue: number;
  productCost: number;
  adSpend: number;
  platformFees: number;
  returns: number;
  netMargin: number;
  unitsSold: number;
  ordersCount: number;
  returnedOrdersCount: number;
  returnRate: number;
}

export interface MarginTimePoint {
  date: string;
  revenue: number;
  netMargin: number;
}
