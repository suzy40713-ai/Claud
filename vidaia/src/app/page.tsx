import Link from "next/link";
import { Check, Mic, PenLine, Download } from "lucide-react";
import { Demo } from "@/components/demo";
import { formatEuros, PACKS, perVideo } from "@/lib/packs";
import { SITE } from "@/lib/site";

export default async function Home(props: { searchParams: Promise<{ annule?: string }> }) {
  const { annule } = await props.searchParams;
  return (
    <main>
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 pt-10 pb-16 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-violet-400">Vidéos TikTok · Reels · Shorts</p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-black tracking-tight sm:text-6xl">
            Ta vidéo prête en 1 minute, <span className="text-violet-400">sans filmer.</span>
          </h1>
          <p className="mt-5 text-lg muted">{SITE.tagline}</p>
          <ul className="mt-6 grid gap-2">
            {[
              "Script écrit par l'IA à partir de ta description",
              "Voix off naturelle en français",
              "Format vertical 1080×1920, prêt à publier",
              "Pas d'abonnement : tu paies un pack, une fois",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="size-5 text-violet-400" /> {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#tarifs" className="btn">Choisir un pack</Link>
            <Link href="/studio" className="btn btn-ghost">J&apos;ai déjà des crédits</Link>
          </div>
        </div>
        <div className="flex justify-center">
          <Demo />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-3xl font-black">Comment ça marche</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: PenLine, title: "1. Tu décris", text: "Ton produit, ton idée ou ton message, en quelques phrases. Tu choisis le ton et la couleur." },
            { icon: Mic, title: "2. L'IA crée", text: "Elle écrit une accroche, 3 points et un appel à l'action, puis une voix off les raconte." },
            { icon: Download, title: "3. Tu télécharges", text: "La vidéo se fabrique dans ton navigateur. Tu la télécharges et tu la publies." },
          ].map((s) => (
            <div key={s.title} className="card p-5">
              <s.icon className="size-6 text-violet-400" />
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm muted">{s.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm muted">
          Style des vidéos : textes animés sur fond coloré, avec voix off (comme l&apos;exemple ci-dessus).
          Pas de personnes filmées ni d&apos;images de stock.
        </p>
      </section>

      <section id="tarifs" className="mx-auto max-w-5xl scroll-mt-6 px-4 pb-20">
        <h2 className="text-3xl font-black">Tarifs</h2>
        <p className="mt-2 muted">Paiement unique, sans abonnement. Tes crédits n&apos;expirent pas.</p>
        {annule ? <p className="mt-4 rounded-xl bg-amber-500/15 p-3 text-amber-200">Paiement annulé : rien n&apos;a été débité.</p> : null}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {PACKS.map((p) => (
            <form key={p.id} action="/api/checkout" method="post" className={`card flex flex-col p-6 ${p.id === "createur" ? "border-violet-500" : ""}`}>
              {p.id === "createur" ? <p className="mb-2 text-xs font-bold uppercase text-violet-400">Le plus choisi</p> : null}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="mt-2 text-4xl font-black">{formatEuros(p.priceCents)}</p>
              <p className="mt-1 muted">{p.videos} vidéos · {formatEuros(perVideo(p))} la vidéo</p>
              <input type="hidden" name="pack" value={p.id} />
              <label className="mt-5 flex items-start gap-2 text-xs muted">
                <input type="checkbox" name="renonciation" value="oui" required className="mt-0.5" />
                <span>
                  J&apos;accepte les <Link href="/cgv" className="underline">conditions de vente</Link> et je demande l&apos;accès immédiat
                  à mes crédits : je renonce à mon droit de rétractation dès la première vidéo générée.
                </span>
              </label>
              <button className="btn mt-5" type="submit">Acheter</button>
            </form>
          ))}
        </div>
        <p className="mt-4 text-xs muted">Paiement sécurisé par Stripe. Prix en euros TTC.</p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-24">
        <h2 className="text-3xl font-black">Questions fréquentes</h2>
        <dl className="mt-6 grid gap-5">
          {[
            ["Faut-il créer un compte ?", "Non. Après le paiement, tu arrives directement dans ton studio et tu reçois un lien d'accès par email."],
            ["Quel format de fichier ?", "Une vidéo verticale 1080×1920 en MP4 (ou WebM selon le navigateur), acceptée par TikTok, Instagram et YouTube Shorts."],
            ["Sur quel appareil ?", "Sur ordinateur avec Chrome ou Edge, c'est le plus fiable. La vidéo se fabrique en temps réel : garde l'onglet ouvert pendant ~30 secondes."],
            ["Et si la génération échoue ?", "Ton crédit est rendu automatiquement."],
            ["Je peux modifier le texte ?", "Pas encore dans cette version : tu peux relancer une génération avec une description plus précise."],
          ].map(([q, a]) => (
            <div key={q}>
              <dt className="font-bold">{q}</dt>
              <dd className="mt-1 muted">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
