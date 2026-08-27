import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useDocumentMeta } from "../../lib/seo";
import { BLOG_POSTS } from "./posts";

export function BlogListPage() {
  const { user } = useAuth();
  useDocumentMeta(
    "Blog Cadenzo — Conseils musculation, nutrition et perte de poids",
    "Guides gratuits sur la musculation, la nutrition et la perte de poids : programmes, recettes, conseils pratiques pour progresser."
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="glass-card sticky top-0 z-20 px-4 py-4">
        <Link to={user ? "/" : "/login"} className="text-lg font-extrabold tracking-tight text-slate-900">
          👑 Cadenzo
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Blog</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Conseils musculation, nutrition et récupération</h1>
        <p className="mt-3 text-slate-600">
          Des guides gratuits pour t'aider a progresser, sans jargon inutile.
        </p>

        <div className="mt-10 flex flex-col gap-6">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5"
            >
              <p className="text-xs font-semibold text-slate-400">{post.readMinutes} min de lecture</p>
              <h2 className="text-xl font-bold text-slate-900">{post.title}</h2>
              <p className="text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
