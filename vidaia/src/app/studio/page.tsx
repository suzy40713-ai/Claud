import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount, listVideos } from "@/server/account";
import { GenerateForm } from "./generate-form";

export const dynamic = "force-dynamic";

export default async function Studio(props: { searchParams: Promise<{ bienvenue?: string }> }) {
  const account = await currentAccount();
  if (!account) redirect("/connexion");
  const { bienvenue } = await props.searchParams;
  const videos = await listVideos(account.id);
  return (
    <main className="mx-auto max-w-3xl px-4 pt-6 pb-24">
      {bienvenue ? (
        <p className="mb-6 rounded-xl bg-emerald-500/15 p-4 text-emerald-200">
          Paiement confirmé, merci ! Tes crédits sont ajoutés. Un lien d&apos;accès a aussi été envoyé à {account.email}.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Mon studio</h1>
        <p className="rounded-full border border-[var(--line)] px-4 py-1.5 text-sm" data-testid="credits">
          <b>{account.credits}</b> crédit{account.credits > 1 ? "s" : ""}
        </p>
      </div>
      {account.credits > 0 ? (
        <GenerateForm />
      ) : (
        <div className="card mt-6 p-6">
          <p className="font-bold">Plus de crédit.</p>
          <p className="mt-1 muted">Choisis un pack pour créer de nouvelles vidéos.</p>
          <Link href="/#tarifs" className="btn mt-4">Voir les packs</Link>
        </div>
      )}
      <h2 className="mt-12 text-xl font-bold">Mes vidéos</h2>
      {videos.length === 0 ? (
        <p className="mt-2 muted">Aucune vidéo pour l&apos;instant.</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {videos.map((v) => (
            <li key={v.id}>
              <Link href={`/studio/${v.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-violet-500">
                <span className="truncate font-medium">{v.script.hook}</span>
                <span className="shrink-0 text-xs muted">
                  {new Date(v.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <form action="/api/deconnexion" method="post" className="mt-12">
        <button className="text-sm muted underline">Se déconnecter ({account.email})</button>
      </form>
    </main>
  );
}
