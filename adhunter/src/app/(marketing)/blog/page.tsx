import Link from "next/link";

import { POSTS } from "@/content/blog";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Blog — publicité en ligne, analyse concurrentielle et marketing digital",
  description: "Guides pratiques pour analyser les publicités de ton marché, écrire de meilleures accroches et créer des campagnes plus efficaces.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const posts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="container max-w-4xl py-20">
      <h1 className="text-4xl font-semibold">Le blog AdHunter</h1>
      <p className="mt-3 text-muted-foreground">Publicité en ligne, analyse concurrentielle et marketing digital — des guides concrets, sans bullshit.</p>
      <div className="mt-12 grid gap-4">
        {posts.map((p) => (
          <article key={p.slug} className="surface card-hover relative p-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-violet-400">{p.category}</span>
              <time dateTime={p.date}>{formatDate(p.date, { day: "numeric", month: "long", year: "numeric" })}</time>
              <span>· {p.readingMinutes} min de lecture</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold">
              <Link href={`/blog/${p.slug}`} className="after:absolute after:inset-0 hover:text-violet-400">{p.title}</Link>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
