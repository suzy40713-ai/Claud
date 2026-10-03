import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/lib/site";

const COLUMNS = [
  {
    title: "Produit",
    links: [
      { href: "/fonctionnalites", label: "Fonctionnalités" },
      { href: "/tarifs", label: "Tarifs" },
      { href: "/signup", label: "Créer un compte" },
      { href: "/login", label: "Connexion" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/#faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/legal/mentions-legales", label: "Mentions légales" },
      { href: "/legal/cgu", label: "Conditions d'utilisation" },
      { href: "/legal/cgv", label: "Conditions de vente" },
      { href: "/legal/confidentialite", label: "Confidentialité" },
      { href: "/legal/cookies", label: "Cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Explore les bibliothèques publicitaires officielles, analyse ton marché et crée de meilleures campagnes.
          </p>
          <p className="text-xs text-muted-foreground">
            AdHunter n'est affilié ni à Meta ni à TikTok. Les publicités affichées proviennent de leurs bibliothèques publiques officielles.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-medium">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="container flex flex-col gap-2 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.</p>
          <a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-foreground">{siteConfig.contactEmail}</a>
        </div>
      </div>
    </footer>
  );
}
