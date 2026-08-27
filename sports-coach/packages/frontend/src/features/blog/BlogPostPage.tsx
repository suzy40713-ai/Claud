import { Link, useParams } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { useDocumentMeta } from "../../lib/seo";
import { getPostBySlug, type BlogBlock } from "./posts";

function Block({ block }: { block: BlogBlock }) {
  if (block.type === "h2") {
    return <h2 className="mt-8 text-xl font-bold text-slate-900">{block.text}</h2>;
  }
  if (block.type === "ul") {
    return (
      <ul className="mt-3 flex flex-col gap-2">
        {block.items.map((item) => (
          <li key={item} className="flex gap-2 text-slate-700">
            <span aria-hidden className="mt-0.5 text-pink-600">
              ✓
            </span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="mt-3 leading-relaxed text-slate-700">{block.text}</p>;
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const post = slug ? getPostBySlug(slug) : undefined;

  useDocumentMeta(
    post ? `${post.title} — Cadenzo` : "Article introuvable — Cadenzo",
    post?.description ?? "Cet article n'existe pas ou plus."
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="glass-card sticky top-0 z-20 px-4 py-4">
        <Link to={user ? "/" : "/login"} className="text-lg font-extrabold tracking-tight text-slate-900">
          👑 Cadenzo
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        {!post ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Article introuvable</h1>
            <Link to="/blog" className="mt-4 inline-block font-semibold text-indigo-600">
              Retour au blog
            </Link>
          </div>
        ) : (
          <>
            <Link to="/blog" className="text-sm font-semibold text-indigo-600">
              ← Tous les articles
            </Link>
            <p className="mt-4 text-xs font-semibold text-slate-400">{post.readMinutes} min de lecture</p>
            <h1 className="mt-1 text-3xl font-extrabold leading-tight text-slate-900">{post.title}</h1>

            <article className="mt-6">
              {post.body.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </article>

            <div className="mt-10 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 text-center">
              <Link to={post.cta.to}>
                <Button className="w-full sm:w-auto">{post.cta.label}</Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
