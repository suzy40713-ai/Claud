import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { readingMinutes } from "@/domain/blog/article";
import { formatInTz } from "@/lib/format";
import { site } from "@/lib/site";
import { getBlogPost } from "@/server/blog/agent";

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Article introuvable" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description },
  };
}

async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();
  const a = post.article;
  const url = `${site.url}/blog/${post.slug}`;
  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.publishedAt.toISOString(),
          mainEntityOfPage: url,
          inLanguage: "fr-FR",
          publisher: { "@type": "Organization", name: site.name, url: site.url },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: a.faq.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }}
      />
      <p className="text-sm text-muted-foreground">
        {formatInTz(post.publishedAt, site.defaultTimeZone, "d MMMM yyyy")} · {readingMinutes(a)} min de lecture
      </p>
      <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-5xl">
        {post.title}
      </h1>
      <p className="mt-5 text-lg text-pretty text-muted-foreground">{a.intro}</p>

      <div className="mt-10 grid gap-10">
        {a.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-2xl font-semibold tracking-[-0.01em] text-balance">{s.heading}</h2>
            <div className="mt-3 grid gap-3 leading-relaxed text-pretty">
              {s.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
            {s.bullets?.length ? (
              <ul className="mt-3 grid list-disc gap-1.5 pl-5 leading-relaxed">
                {s.bullets.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <aside className="mt-12 rounded-2xl border bg-primary/5 p-6">
        <p className="flex items-center gap-2 font-semibold">
          <Lightbulb className="size-5 text-primary" /> À faire aujourd&apos;hui
        </p>
        <p className="mt-2 leading-relaxed">{a.takeaway}</p>
      </aside>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Questions fréquentes</h2>
        <dl className="mt-4 grid gap-5">
          {a.faq.map((f, i) => (
            <div key={i}>
              <dt className="font-semibold">{f.question}</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-14 rounded-2xl border bg-card p-6 text-center shadow-xs">
        <p className="text-xl font-semibold text-balance">Vous ne savez pas encore quoi vendre ?</p>
        <p className="mt-2 text-muted-foreground">
          Choisissez ce que vous savez faire : une idée, un prix de départ et vos 3 premières actions. Gratuit.
        </p>
        <Button asChild size="lg" className="mt-5">
          <Link href="/lancer-mon-activite">Trouver mon idée en 2 minutes</Link>
        </Button>
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Article rédigé avec l&apos;aide d&apos;une IA et vérifié automatiquement (aucune promesse de
        résultat). Les conseils sont généraux : adaptez-les à votre situation.
      </p>
    </article>
  );
}

export default function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pt-10 pb-24 sm:px-6 sm:pt-14">
      <Link
        href={"/blog" as Route}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Tous les articles
      </Link>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <Article params={props.params} />
      </Suspense>
    </main>
  );
}
