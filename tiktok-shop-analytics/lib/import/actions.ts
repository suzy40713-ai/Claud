"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ValidatedRow } from "@/lib/import/validate";
import type { ImportEntityKey } from "@/lib/import/entities";
import type { OrderStatus, PlatformFeeType, TablesInsert } from "@/types/database";

export interface ImportRowError {
  rowIndex: number;
  message: string;
}

export interface ImportReport {
  insertedCount: number;
  errors: ImportRowError[];
}

function allRowsFailed(rows: ValidatedRow[], message: string): ImportReport {
  return {
    insertedCount: 0,
    errors: rows.map((row) => ({ rowIndex: row.rowIndex, message })),
  };
}

async function importOrders(
  storeId: string,
  rows: ValidatedRow[],
): Promise<ImportReport> {
  const supabase = await createClient();
  const errors: ImportRowError[] = [];

  const skus = Array.from(new Set(rows.map((r) => String(r.values.sku))));
  const { data: existingProducts, error: productsError } = await supabase
    .from("products")
    .select("id, sku")
    .eq("store_id", storeId)
    .in("sku", skus);

  if (productsError) return allRowsFailed(rows, productsError.message);

  const skuToProductId = new Map<string, string>();
  for (const p of existingProducts ?? []) skuToProductId.set(p.sku, p.id);

  const productsToCreate = new Map<string, TablesInsert<"products">>();
  for (const row of rows) {
    const sku = String(row.values.sku);
    if (skuToProductId.has(sku) || productsToCreate.has(sku)) continue;
    const name = row.values.product_name;
    const costPrice = row.values.cost_price;
    if (typeof name === "string" && name.trim() && typeof costPrice === "number") {
      productsToCreate.set(sku, {
        store_id: storeId,
        sku,
        name: name.trim(),
        cost_price: costPrice,
        sale_price:
          typeof row.values.unit_sale_price === "number"
            ? row.values.unit_sale_price
            : costPrice,
      });
    }
  }

  if (productsToCreate.size > 0) {
    const { data: created, error: createError } = await supabase
      .from("products")
      .insert(Array.from(productsToCreate.values()))
      .select("id, sku");
    if (createError) {
      return allRowsFailed(rows, `Création produit échouée : ${createError.message}`);
    }
    for (const p of created ?? []) skuToProductId.set(p.sku, p.id);
  }

  const inserts: TablesInsert<"orders">[] = [];
  const rowIndexes: number[] = [];
  for (const row of rows) {
    const sku = String(row.values.sku);
    const productId = skuToProductId.get(sku);
    if (!productId) {
      errors.push({
        rowIndex: row.rowIndex,
        message: `SKU "${sku}" introuvable. Fournissez un nom de produit et un coût de revient pour le créer automatiquement, ou importez-le au préalable.`,
      });
      continue;
    }
    inserts.push({
      store_id: storeId,
      product_id: productId,
      external_order_id: (row.values.external_order_id as string) ?? null,
      quantity: typeof row.values.quantity === "number" ? row.values.quantity : 1,
      unit_sale_price: row.values.unit_sale_price as number,
      order_date: row.values.order_date as string,
      status: (row.values.status as OrderStatus) ?? "completed",
    });
    rowIndexes.push(row.rowIndex);
  }

  if (inserts.length === 0) return { insertedCount: 0, errors };

  const { error: insertError, count } = await supabase
    .from("orders")
    .insert(inserts, { count: "exact" });

  if (insertError) {
    for (const rowIndex of rowIndexes) {
      errors.push({ rowIndex, message: `Insertion échouée : ${insertError.message}` });
    }
    return { insertedCount: 0, errors };
  }

  return { insertedCount: count ?? inserts.length, errors };
}

async function importReturns(
  storeId: string,
  rows: ValidatedRow[],
): Promise<ImportReport> {
  const supabase = await createClient();
  const errors: ImportRowError[] = [];

  const externalIds = Array.from(
    new Set(rows.map((r) => String(r.values.external_order_id))),
  );
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, external_order_id")
    .eq("store_id", storeId)
    .in("external_order_id", externalIds);

  if (ordersError) return allRowsFailed(rows, ordersError.message);

  const externalIdToOrderId = new Map<string, string>();
  for (const o of orders ?? []) {
    if (o.external_order_id) externalIdToOrderId.set(o.external_order_id, o.id);
  }

  const inserts: TablesInsert<"returns">[] = [];
  const rowIndexes: number[] = [];
  for (const row of rows) {
    const externalId = String(row.values.external_order_id);
    const orderId = externalIdToOrderId.get(externalId);
    if (!orderId) {
      errors.push({
        rowIndex: row.rowIndex,
        message: `Commande "${externalId}" introuvable parmi les commandes importées.`,
      });
      continue;
    }
    inserts.push({
      order_id: orderId,
      return_date: row.values.return_date as string,
      reason: (row.values.reason as string) ?? null,
      refunded_amount: row.values.refunded_amount as number,
    });
    rowIndexes.push(row.rowIndex);
  }

  if (inserts.length === 0) return { insertedCount: 0, errors };

  const { error: insertError, count } = await supabase
    .from("returns")
    .insert(inserts, { count: "exact" });

  if (insertError) {
    for (const rowIndex of rowIndexes) {
      errors.push({ rowIndex, message: `Insertion échouée : ${insertError.message}` });
    }
    return { insertedCount: 0, errors };
  }

  return { insertedCount: count ?? inserts.length, errors };
}

async function importAdSpend(
  storeId: string,
  rows: ValidatedRow[],
): Promise<ImportReport> {
  const supabase = await createClient();
  const errors: ImportRowError[] = [];

  const skus = Array.from(
    new Set(
      rows
        .map((r) => r.values.sku)
        .filter((s): s is string => typeof s === "string" && s.length > 0),
    ),
  );

  const skuToProductId = new Map<string, string>();
  if (skus.length > 0) {
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, sku")
      .eq("store_id", storeId)
      .in("sku", skus);
    if (productsError) return allRowsFailed(rows, productsError.message);
    for (const p of products ?? []) skuToProductId.set(p.sku, p.id);
  }

  const inserts: TablesInsert<"ad_spend">[] = [];
  const rowIndexes: number[] = [];
  for (const row of rows) {
    const sku = row.values.sku as string | null;
    let productId: string | null = null;
    if (sku) {
      const resolved = skuToProductId.get(sku);
      if (!resolved) {
        errors.push({
          rowIndex: row.rowIndex,
          message: `SKU "${sku}" introuvable dans le catalogue.`,
        });
        continue;
      }
      productId = resolved;
    }
    inserts.push({
      store_id: storeId,
      product_id: productId,
      campaign_name: row.values.campaign_name as string,
      platform: (row.values.platform as string) ?? "tiktok_ads",
      amount: row.values.amount as number,
      period_start: row.values.period_start as string,
      period_end: row.values.period_end as string,
    });
    rowIndexes.push(row.rowIndex);
  }

  if (inserts.length === 0) return { insertedCount: 0, errors };

  const { error: insertError, count } = await supabase
    .from("ad_spend")
    .insert(inserts, { count: "exact" });

  if (insertError) {
    for (const rowIndex of rowIndexes) {
      errors.push({ rowIndex, message: `Insertion échouée : ${insertError.message}` });
    }
    return { insertedCount: 0, errors };
  }

  return { insertedCount: count ?? inserts.length, errors };
}

async function importPlatformFees(
  storeId: string,
  rows: ValidatedRow[],
): Promise<ImportReport> {
  const supabase = await createClient();
  const errors: ImportRowError[] = [];

  const externalIds = Array.from(
    new Set(
      rows
        .map((r) => r.values.external_order_id)
        .filter((s): s is string => typeof s === "string" && s.length > 0),
    ),
  );

  const externalIdToOrderId = new Map<string, string>();
  if (externalIds.length > 0) {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, external_order_id")
      .eq("store_id", storeId)
      .in("external_order_id", externalIds);
    if (ordersError) return allRowsFailed(rows, ordersError.message);
    for (const o of orders ?? []) {
      if (o.external_order_id) externalIdToOrderId.set(o.external_order_id, o.id);
    }
  }

  const inserts: TablesInsert<"platform_fees">[] = [];
  const rowIndexes: number[] = [];
  for (const row of rows) {
    const externalId = row.values.external_order_id as string | null;
    let orderId: string | null = null;
    if (externalId) {
      const resolved = externalIdToOrderId.get(externalId);
      if (!resolved) {
        errors.push({
          rowIndex: row.rowIndex,
          message: `Commande "${externalId}" introuvable parmi les commandes importées.`,
        });
        continue;
      }
      orderId = resolved;
    }
    inserts.push({
      store_id: storeId,
      order_id: orderId,
      fee_type: row.values.fee_type as PlatformFeeType,
      amount: row.values.amount as number,
      period_start: (row.values.period_start as string) ?? null,
      period_end: (row.values.period_end as string) ?? null,
    });
    rowIndexes.push(row.rowIndex);
  }

  if (inserts.length === 0) return { insertedCount: 0, errors };

  const { error: insertError, count } = await supabase
    .from("platform_fees")
    .insert(inserts, { count: "exact" });

  if (insertError) {
    for (const rowIndex of rowIndexes) {
      errors.push({ rowIndex, message: `Insertion échouée : ${insertError.message}` });
    }
    return { insertedCount: 0, errors };
  }

  return { insertedCount: count ?? inserts.length, errors };
}

export async function importRows(
  entity: ImportEntityKey,
  storeId: string,
  rows: ValidatedRow[],
): Promise<ImportReport> {
  if (rows.length === 0) return { insertedCount: 0, errors: [] };

  let report: ImportReport;
  switch (entity) {
    case "orders":
      report = await importOrders(storeId, rows);
      break;
    case "returns":
      report = await importReturns(storeId, rows);
      break;
    case "ad_spend":
      report = await importAdSpend(storeId, rows);
      break;
    case "platform_fees":
      report = await importPlatformFees(storeId, rows);
      break;
  }

  revalidatePath("/dashboard");
  revalidatePath("/import");
  return report;
}
