import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrendRadar — Trouve tes prochaines idées de contenu",
  description:
    "TrendRadar aide les créateurs TikTok, Instagram Reels et YouTube Shorts à trouver rapidement des idées de contenu adaptées à leur niche grâce à l'IA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-background text-white antialiased">
        {children}
      </body>
    </html>
  );
}
