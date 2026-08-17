import type { Metadata, Viewport } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Rajdhani({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Club Pro FC 27 — La plateforme des joueurs et clubs Pro Clubs",
  description:
    "Réseau social, recrutement et hub e-sport pour les joueurs et clubs FC 27 Pro Clubs. Rejoignez African FC, trouvez un club, organisez vos tournois.",
};

export const viewport: Viewport = {
  themeColor: "#06080a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background bg-noise">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
