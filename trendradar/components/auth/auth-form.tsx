"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;
        setMessage(
          "Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi."
        );
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        const redirect = searchParams.get("redirect") || "/dashboard";
        router.push(redirect);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label className="mb-1.5 block text-sm text-white/70">Nom complet</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface2 px-4 py-2.5 text-sm text-white outline-none ring-accent/50 transition focus:ring-2"
            placeholder="Ton nom"
          />
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-sm text-white/70">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface2 px-4 py-2.5 text-sm text-white outline-none ring-accent/50 transition focus:ring-2"
          placeholder="toi@exemple.com"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-white/70">Mot de passe</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface2 px-4 py-2.5 text-sm text-white outline-none ring-accent/50 transition focus:ring-2"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-accent-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:opacity-90 disabled:opacity-50"
      >
        {loading
          ? "Chargement..."
          : mode === "signup"
          ? "Créer mon compte gratuit"
          : "Se connecter"}
      </button>

      <p className="text-center text-sm text-white/50">
        {mode === "signup" ? (
          <>
            Déjà un compte ?{" "}
            <Link href="/login" className="text-accent-light hover:underline">
              Se connecter
            </Link>
          </>
        ) : (
          <>
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-accent-light hover:underline">
              Commencer gratuitement
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
