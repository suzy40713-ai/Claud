"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { THEMES, TONE_LABELS, TONES } from "@/lib/script";
import { THEME_COLORS } from "@/components/renderer";

export function GenerateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [theme, setTheme] = useState<(typeof THEMES)[number]>("violet");

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: f.get("description"),
          tone: f.get("tone"),
          cta: f.get("cta"),
          theme,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { videoId?: string; error?: string };
      if (!res.ok || !data.videoId) return setError(data.error ?? "Erreur inattendue. Réessayez.");
      router.push(`/studio/${data.videoId}`);
    });
  }

  return (
    <form onSubmit={submit} className="card mt-6 grid gap-5 p-5 sm:p-6">
      <div>
        <label htmlFor="description" className="font-bold">Décris ta vidéo</label>
        <textarea
          id="description"
          name="description"
          required
          minLength={15}
          maxLength={800}
          rows={5}
          className="input mt-2"
          placeholder="Ex. : Je vends des bougies parfumées faites main à 19,90 €. Je veux une vidéo qui donne envie de les offrir à Noël, pour les 25-40 ans qui aiment la déco cosy."
        />
        <p className="mt-1 text-xs muted">Plus tu es précis (produit, public, message), meilleure est la vidéo.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tone" className="font-bold">Ton</label>
          <select id="tone" name="tone" className="input mt-2" defaultValue="dynamique">
            {TONES.map((t) => (
              <option key={t} value={t}>{TONE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cta" className="font-bold">Appel à l&apos;action (facultatif)</label>
          <input id="cta" name="cta" maxLength={40} className="input mt-2" placeholder="Lien en bio 👆" />
        </div>
      </div>
      <fieldset>
        <legend className="font-bold">Couleur</legend>
        <div className="mt-2 flex gap-3">
          {THEMES.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTheme(t)}
              aria-label={t}
              aria-pressed={theme === t}
              className={`size-10 rounded-full border-4 ${theme === t ? "border-white" : "border-transparent"}`}
              style={{ background: `linear-gradient(135deg, ${THEME_COLORS[t].accent}, ${THEME_COLORS[t].bg1})` }}
            />
          ))}
        </div>
      </fieldset>
      {error ? <p className="rounded-xl bg-red-500/15 p-3 text-red-200" role="alert">{error}</p> : null}
      <button className="btn" disabled={pending} type="submit">
        {pending ? "Écriture du script et de la voix… (environ 20 secondes)" : "Créer ma vidéo (1 crédit)"}
      </button>
    </form>
  );
}
