import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Produit — TikTok Shop Analytics",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Produit {id}
      </h1>
      <p className="mt-2 text-neutral-600">
        L&apos;historique des ventes, coûts, marge et tendance arrivent à
        l&apos;étape 5.
      </p>
    </div>
  );
}
