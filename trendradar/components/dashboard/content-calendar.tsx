"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEntry, Idea } from "@/lib/supabase/types";

export function ContentCalendar({ canUseCalendar }: { canUseCalendar: boolean }) {
  const supabase = createClient();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<Idea[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [ideaId, setIdeaId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data: entryData }, { data: ideaData }] = await Promise.all([
      supabase.from("calendar_entries").select("*").order("scheduled_date", { ascending: true }),
      supabase.from("ideas").select("*").eq("is_saved", true).order("created_at", { ascending: false }),
    ]);
    setEntries((entryData as CalendarEntry[]) || []);
    setSavedIdeas((ideaData as Idea[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !date) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: insertError } = await supabase.from("calendar_entries").insert({
      user_id: user.id,
      title,
      scheduled_date: date,
      idea_id: ideaId || null,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTitle("");
    setDate("");
    setIdeaId("");
    load();
  }

  async function handleStatusChange(entry: CalendarEntry, status: CalendarEntry["status"]) {
    await supabase.from("calendar_entries").update({ status }).eq("id", entry.id);
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status } : e)));
  }

  async function handleDelete(id: string) {
    await supabase.from("calendar_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  if (!canUseCalendar) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center">
        <h1 className="text-2xl font-bold">Calendrier de contenu</h1>
        <p className="mx-auto mt-3 max-w-md text-white/60">
          Le calendrier de contenu est disponible à partir du plan Creator. Passe à un plan
          supérieur pour planifier tes publications.
        </p>
        <a
          href="/dashboard/settings"
          className="mt-6 inline-block rounded-lg bg-accent-gradient px-6 py-3 text-sm font-semibold shadow-lg shadow-accent/20 transition hover:opacity-90"
        >
          Voir les plans
        </a>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Calendrier de contenu</h1>
      <p className="mt-1 text-white/60">Planifie tes prochaines publications.</p>

      <form onSubmit={handleAdd} className="glass-card mt-6 flex flex-wrap gap-3 rounded-2xl p-6">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la publication"
          className="min-w-[200px] flex-1 rounded-lg border border-border bg-surface2 px-4 py-2.5 text-white outline-none ring-accent/50 transition focus:ring-2"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-border bg-surface2 px-4 py-2.5 text-white outline-none ring-accent/50 transition focus:ring-2"
        />
        <select
          value={ideaId}
          onChange={(e) => setIdeaId(e.target.value)}
          className="rounded-lg border border-border bg-surface2 px-4 py-2.5 text-white outline-none ring-accent/50 transition focus:ring-2"
        >
          <option value="">Idée liée (optionnel)</option>
          {savedIdeas.map((idea) => (
            <option key={idea.id} value={idea.id}>
              {idea.title}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-accent-gradient px-6 py-2.5 text-sm font-semibold shadow-lg shadow-accent/20 transition hover:opacity-90"
        >
          Ajouter
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-8 space-y-3">
        {loading && <p className="text-white/50">Chargement...</p>}
        {!loading && entries.length === 0 && (
          <p className="text-white/50">Aucune publication planifiée pour l'instant.</p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
          >
            <div>
              <p className="text-xs text-white/40">
                {new Date(entry.scheduled_date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <p className="font-medium">{entry.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={entry.status}
                onChange={(e) => handleStatusChange(entry, e.target.value as CalendarEntry["status"])}
                className="rounded-lg border border-white/15 bg-surface2 px-2 py-1.5 text-xs"
              >
                <option value="planned">Planifié</option>
                <option value="in_progress">En cours</option>
                <option value="published">Publié</option>
              </select>
              <button
                onClick={() => handleDelete(entry.id)}
                className="rounded-lg border border-white/15 px-2 py-1.5 text-xs text-white/50 hover:bg-white/5"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
