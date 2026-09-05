import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FAITSTORY AI",
  description: "Genere automatiquement des videos TikTok de faits et astuces utiles.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm">
                📖
              </span>
              FAITSTORY <span className="text-accent">AI</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-muted">
              <Link href="/" className="hover:text-foreground">
                Creer une video
              </Link>
              <Link href="/videos" className="hover:text-foreground">
                Mes videos
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
