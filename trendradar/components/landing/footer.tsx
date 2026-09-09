import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/40 md:flex-row">
        <p className="flex items-center gap-2">
          <span className="text-accent-light">◈</span> TrendRadar — Ne cherche plus quoi publier.
        </p>
        <div className="flex gap-6">
          <Link href="/pricing" className="hover:text-white/70">Tarifs</Link>
          <a href="#faq" className="hover:text-white/70">FAQ</a>
          <Link href="/login" className="hover:text-white/70">Connexion</Link>
        </div>
        <p>© {new Date().getFullYear()} TrendRadar</p>
      </div>
    </footer>
  );
}
