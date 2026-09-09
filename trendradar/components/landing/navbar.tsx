import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="text-accent-light">◈</span> TrendRadar
        </Link>
        <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#how-it-works" className="hover:text-white">Comment ça marche</a>
          <a href="#features" className="hover:text-white">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-white">Tarifs</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white">
            Connexion
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-accent-gradient px-4 py-2 text-sm font-semibold shadow-lg shadow-accent/20 transition hover:opacity-90"
          >
            Commencer gratuitement
          </Link>
        </div>
      </nav>
    </header>
  );
}
