import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateStoreForm } from "@/components/import/CreateStoreForm";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { StatCards } from "@/components/dashboard/StatCards";
import { MarginChart } from "@/components/dashboard/MarginChart";
import { ProductMarginTable } from "@/components/dashboard/ProductMarginTable";
import { resolveDateRange } from "@/lib/margin/date-range";
import { getMarginData } from "@/lib/margin/queries";
import {
  computeGlobalMargin,
  computeMarginTimeSeries,
  computeProductMargins,
} from "@/lib/margin/compute";

export const metadata: Metadata = {
  title: "Dashboard — TikTok Shop Analytics",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; from?: string; to?: string; preset?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .order("created_at", { ascending: true });

  if (!stores || stores.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-2 text-neutral-600">
          Créez d&apos;abord votre boutique, puis importez vos données pour
          voir votre marge nette réelle.
        </p>
        <div className="mt-6">
          <CreateStoreForm />
        </div>
      </div>
    );
  }

  const activeStore = stores.find((s) => s.id === params.store) ?? stores[0];
  const { range, preset } = resolveDateRange(params);

  const marginData = await getMarginData(activeStore.id);
  const globalSummary = computeGlobalMargin(marginData, range);
  const productMargins = computeProductMargins(marginData, range);
  const timeSeries = computeMarginTimeSeries(marginData, range);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        {stores.length > 1 && (
          <div className="flex gap-2 text-sm">
            {stores.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard?store=${s.id}`}
                className={`rounded-md px-3 py-1.5 ${
                  s.id === activeStore.id
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-300 text-neutral-700"
                }`}
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <DateRangePicker activePreset={preset} range={range} />

      <StatCards summary={globalSummary} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Évolution de la marge
        </h2>
        <MarginChart data={timeSeries} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Produits par marge nette
        </h2>
        <ProductMarginTable products={productMargins} />
        <p className="mt-2 text-xs text-neutral-400">
          Les dépenses publicitaires et frais de plateforme non rattachés à
          un produit spécifique n&apos;apparaissent que dans la marge nette
          globale ci-dessus, pas dans ce tableau.
        </p>
      </div>
    </div>
  );
}
