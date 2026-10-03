import { createAdminClient } from "@/lib/supabase/server";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMessages() {
  const { data: messages } = await createAdminClient().from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Messages de contact</h1>
      {(messages ?? []).length === 0 ? (
        <p className="surface p-6 text-sm text-muted-foreground">Aucun message.</p>
      ) : (
        <ul className="space-y-3">
          {(messages ?? []).map((m) => (
            <li key={m.id} className="surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{m.subject}</p>
                <span className="text-xs text-muted-foreground">{formatRelative(m.created_at)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="text-violet-400 hover:underline">{m.email}</a></p>
              <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
