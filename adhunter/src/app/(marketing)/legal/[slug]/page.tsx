import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Prose } from "@/components/marketing/prose";
import { LEGAL_PAGES } from "@/content/legal";

export function generateStaticParams() {
  return LEGAL_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const found = LEGAL_PAGES.find((p) => p.slug === slug);
  if (!found) return {};
  return { title: found.title, description: found.description, alternates: { canonical: `/legal/${found.slug}` } };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = LEGAL_PAGES.find((p) => p.slug === slug);
  if (!page) notFound();
  return (
    <div className="container grid max-w-5xl gap-10 py-20 md:grid-cols-[200px_1fr]">
      <nav aria-label="Pages légales" className="md:sticky md:top-24 md:self-start">
        <ul className="flex flex-wrap gap-2 md:flex-col md:gap-1">
          {LEGAL_PAGES.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/legal/${p.slug}`}
                className={`block rounded-md px-3 py-1.5 text-sm ${p.slug === slug ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                aria-current={p.slug === slug ? "page" : undefined}
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <article>
        <h1 className="text-3xl font-semibold sm:text-4xl">{page.title}</h1>
        <div className="mt-8">
          <Prose>{page.content}</Prose>
        </div>
      </article>
    </div>
  );
}
