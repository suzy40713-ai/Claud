import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { emailMessage } from "@/db/schema";
import { env } from "@/lib/env";

/** Boîte de réception de développement : emails journalisés quand aucun fournisseur n'est configuré. */
async function Inbox() {
  await connection();
  if (env.NODE_ENV === "production") notFound();
  const emails = await db
    .select()
    .from(emailMessage)
    .orderBy(desc(emailMessage.createdAt))
    .limit(30);
  return (
    <ul className="grid gap-4">
      {emails.length === 0 ? <li className="text-sm text-muted-foreground">Aucun email.</li> : null}
      {emails.map((m) => (
        <li key={m.id} className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">{m.subject}</p>
          <p className="text-[13px] text-muted-foreground">
            → {m.to} · {m.status} · {m.createdAt.toLocaleString("fr-FR")}
          </p>
          <pre className="mt-3 overflow-x-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
            {m.text}
          </pre>
        </li>
      ))}
    </ul>
  );
}

export default function DevEmailsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold">Emails (développement)</h1>
      <Suspense>
        <Inbox />
      </Suspense>
    </main>
  );
}
