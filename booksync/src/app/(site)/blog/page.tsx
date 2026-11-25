import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInTz } from "@/lib/format";
import { site } from "@/lib/site";
import { listBlogPosts } from "@/server/blog/agent";

export const metadata: Metadata = {
  title: "Blog — Vendre quand on débute",
  description:
    "Conseils concrets pour trouver quoi vendre, fixer son prix, trouver ses premiers clients et faire ses premières ventes.",
  alternates: { canonical: "/blog" },
};

async function Posts() {
  await connection();
  const posts = await listBlogPosts();
  if (posts.length === 0)
    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <p className="font-medium">Les premiers articles arrivent bientôt.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          En attendant, trouvez une idée à vendre en 2 minutes.
        </p>
        <Button asChild className="mt-4">
          <Link href="/lancer-mon-activite">Trouver quoi vendre</Link>
        </Button>
      </div>
    );
  return (
    <ul className="grid gap-4">
      {posts.map((p) => (
        <li key={p.slug}>
          <Link
            href={`/blog/${p.slug}` as Route}
            className="block rounded-2xl border bg-card p-5 shadow-xs transition-colors hover:border-primary/40"
            data-testid="blog-post"
          >
            <p className="text-xs text-muted-foreground">
              {formatInTz(p.publishedAt, site.defaultTimeZone, "d MMMM yyyy")}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-balance">{p.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Lire l&apos;article <ArrowRight className="size-4" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function BlogPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-14 pb-24 sm:px-6 sm:pt-20">
      <p className="text-sm font-semibold tracking-wide text-primary">Blog</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
        Vendre quand on débute
      </h1>
      <p className="mt-4 text-lg text-pretty text-muted-foreground">
        Des conseils concrets pour trouver quoi vendre, fixer votre prix et faire vos premières ventes.
      </p>
      <div className="mt-10">
        <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
          <Posts />
        </Suspense>
      </div>
    </main>
  );
}
