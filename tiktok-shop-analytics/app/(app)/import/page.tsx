import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateStoreForm } from "@/components/import/CreateStoreForm";
import { ImportWizard } from "@/components/import/ImportWizard";

export const metadata: Metadata = {
  title: "Import — TikTok Shop Analytics",
};

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>;
}) {
  const { store: storeParam } = await searchParams;
  const supabase = await createClient();

  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .order("created_at", { ascending: true });

  if (!stores || stores.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Import de données
        </h1>
        <p className="mt-2 text-neutral-600">
          Créez d&apos;abord votre boutique pour pouvoir importer des
          commandes, retours, dépenses pub et frais de plateforme.
        </p>
        <div className="mt-6">
          <CreateStoreForm />
        </div>
      </div>
    );
  }

  const activeStore = stores.find((s) => s.id === storeParam) ?? stores[0];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Import de données
        </h1>
        {stores.length > 1 && (
          <div className="flex gap-2 text-sm">
            {stores.map((s) => (
              <Link
                key={s.id}
                href={`/import?store=${s.id}`}
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
      <div className="mt-6">
        <ImportWizard key={activeStore.id} storeId={activeStore.id} />
      </div>
    </div>
  );
}
