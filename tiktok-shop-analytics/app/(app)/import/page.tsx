import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import — TikTok Shop Analytics",
};

export default function ImportPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">
        Import de données
      </h1>
      <p className="mt-2 text-neutral-600">
        L&apos;upload CSV (commandes, retours, frais, dépenses pub) avec
        mapping de colonnes arrive à l&apos;étape 3.
      </p>
    </div>
  );
}
