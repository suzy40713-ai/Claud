export default async function Connexion(props: { searchParams: Promise<{ envoye?: string; lien?: string; paiement?: string }> }) {
  const sp = await props.searchParams;
  return (
    <main className="mx-auto max-w-md px-4 pt-10 pb-24">
      <h1 className="text-3xl font-black">Retrouver mon accès</h1>
      <p className="mt-2 muted">Entre l&apos;adresse email utilisée lors de ton achat : on t&apos;envoie un lien pour ouvrir ton studio.</p>
      {sp.paiement ? (
        <p className="mt-4 rounded-xl bg-amber-500/15 p-3 text-amber-200">
          Ton paiement n&apos;est pas encore confirmé. S&apos;il a bien été débité, tu recevras ton lien d&apos;accès par email ; sinon, réessaie.
        </p>
      ) : null}
      {sp.lien ? <p className="mt-4 rounded-xl bg-amber-500/15 p-3 text-amber-200">Ce lien a expiré. Demande-en un nouveau.</p> : null}
      {sp.envoye ? (
        <p className="mt-4 rounded-xl bg-emerald-500/15 p-3 text-emerald-200">
          Si un compte existe avec cette adresse, un lien vient d&apos;être envoyé. Pense à regarder dans les spams.
        </p>
      ) : null}
      <form action="/api/connexion" method="post" className="card mt-6 grid gap-3 p-5">
        <label htmlFor="email" className="font-bold">Email</label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" />
        <button className="btn" type="submit">Recevoir mon lien</button>
      </form>
    </main>
  );
}
