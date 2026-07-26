import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="max-w-xl">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
          La marge nette réelle de votre boutique TikTok Shop
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          Centralisez ventes, frais de plateforme, dépenses publicitaires et
          retours produits pour connaître votre rentabilité réelle, par
          produit et par campagne.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Créer un compte
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          Se connecter
        </Link>
      </div>
    </div>
  );
}
