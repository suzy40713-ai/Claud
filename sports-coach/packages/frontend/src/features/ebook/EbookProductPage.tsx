import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { EbookSwitcher } from "./EbookSwitcher";

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

interface EbookProductPageProps {
  productId: string;
  emoji: string;
  eyebrow: string;
  titre: string;
  description: string;
  contenu: string[];
}

export function EbookProductPage({ productId, emoji, eyebrow, titre, description, contenu }: EbookProductPageProps) {
  const location = useLocation();
  const { user } = useAuth();
  const [status, setStatus] = useState<{ configured: boolean; priceCents: number; compareAtPriceCents: number } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkoutParam = new URLSearchParams(location.search).get("checkout");

  useEffect(() => {
    api.getEbookStatus(productId).then(setStatus);
  }, [productId]);

  async function handleBuy() {
    setBusy(true);
    setError(null);
    try {
      const { url } = await api.createEbookCheckoutSession(productId);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de demarrer le paiement");
      setBusy(false);
    }
  }

  const price = status ? formatPrice(status.priceCents) : "9,99 €";
  const compareAtPrice = status ? formatPrice(status.compareAtPriceCents) : "19,99 €";

  return (
    <div className="min-h-screen bg-white">
      <header className="glass-card sticky top-0 z-20 px-4 py-4">
        <Link to={user ? "/" : "/login"} className="text-lg font-extrabold tracking-tight text-slate-900">
          👑 Cadenzo
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {checkoutParam === "succes" && (
          <p className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Paiement recu, merci ! Ton ebook part vers ta boite mail dans quelques instants — pense a verifier tes
            spams si tu ne le vois pas passer.
          </p>
        )}
        {checkoutParam === "annule" && (
          <p className="mb-6 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            Paiement annule. Tu peux reessayer quand tu veux.
          </p>
        )}
        {status && !status.configured && (
          <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            L'achat n'est pas encore configure sur ce serveur (cles Stripe manquantes).
          </p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl bg-slate-900 px-6 py-10 text-center text-white sm:px-10"
        >
          <div className="bg-gradient-kadence pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full opacity-30 blur-3xl" />
          <span aria-hidden className="relative text-4xl">
            {emoji}
          </span>
          <p className="relative mt-3 text-xs font-bold uppercase tracking-widest text-pink-300">{eyebrow}</p>
          <h1 className="relative mt-2 text-3xl font-extrabold leading-tight">{titre}</h1>
          <p className="relative mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">{description}</p>
          <div className="relative mt-6 flex items-baseline justify-center gap-3">
            <span className="text-base text-slate-400 line-through">{compareAtPrice}</span>
            <span className="text-gradient-kadence text-3xl font-extrabold">{price}</span>
          </div>
          <Button disabled={busy || !status?.configured} onClick={handleBuy} className="relative mt-5">
            {busy ? "Redirection..." : "Je recois mon ebook maintenant"}
          </Button>
          {error && <p className="relative mt-2 text-sm text-red-300">{error}</p>}
        </motion.div>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-10"
        >
          <h2 className="text-xl font-bold text-slate-900">Ce que tu vas recevoir</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {contenu.map((c) => (
              <li key={c} className="flex gap-3 text-sm text-slate-700">
                <span aria-hidden className="mt-0.5 text-pink-600">
                  ✓
                </span>
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { icon: "🔒", label: "Paiement Stripe" },
            { icon: "📩", label: "Envoi immédiat" },
            { icon: "📖", label: "PDF" },
            { icon: "✉️", label: "Support direct" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1 rounded-xl border border-slate-100 bg-slate-50 px-2 py-3 text-center"
            >
              <span aria-hidden className="text-lg leading-none">
                {item.icon}
              </span>
              <span className="text-xs font-medium leading-tight text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>

        <EbookSwitcher current={productId} />
      </main>
    </div>
  );
}
