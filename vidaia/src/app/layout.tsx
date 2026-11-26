import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: `${SITE.name} : tes vidéos TikTok et Reels faites par l'IA`, template: `%s · ${SITE.name}` },
  description:
    "Décris ta vidéo en quelques phrases : VidaIA écrit le script, ajoute une voix off naturelle et te donne une vidéo verticale prête pour TikTok, Reels et Shorts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh flex flex-col">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-black tracking-tight">
            Vida<span className="text-violet-400">IA</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/#tarifs" className="muted hover:text-white">Tarifs</Link>
            <Link href="/studio" className="btn btn-ghost !py-2 !px-4">Mon studio</Link>
          </nav>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-[var(--line)] py-8 text-sm muted">
          <div className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4">
            <span>© 2026 VidaIA</span>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/cgv">Conditions de vente</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/connexion">Retrouver mon accès</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
