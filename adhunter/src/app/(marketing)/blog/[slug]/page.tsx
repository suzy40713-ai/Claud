import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BlockRenderer } from "@/components/marketing/prose";
import { FinalCta } from "@/components/marketing/sections";
import { POSTS, getPost } from "@/content/blog";
import { siteConfig } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
    mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="container max-w-3xl py-20">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tous les articles
        </Link>
        <header className="mt-8">
          <p className="text-xs text-muted-foreground">
            <span className="text-violet-400">{post.category}</span> · <time dateTime={post.date}>{formatDate(post.date, { day: "numeric", month: "long", year: "numeric" })}</time> · {post.readingMinutes} min
          </p>
          <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight sm:text-4xl">{post.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{post.description}</p>
        </header>
        <div className="mt-10">
          <BlockRenderer blocks={post.blocks} />
        </div>
      </article>
      <FinalCta />
    </>
  );
}
