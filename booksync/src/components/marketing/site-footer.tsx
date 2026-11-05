import Link from "next/link";
import type { Route } from "next";
import { Logo } from "@/components/brand/logo";
import { site } from "@/lib/site";

const COLUMNS = [
  {
    title: "Produit",
    links: [
      { href: "/#fonctionnalites", label: "Fonctionnalités" },
      { href: "/#tarifs", label: "Tarifs" },
      { href: "/#faq", label: "Questions fréquentes" },
      { href: "/inscription", label: "Créer un compte" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/conditions-generales", label: "Conditions générales" },
      { href: "/confidentialite", label: "Politique de confidentialité" },
    ],
  },
  {
    title: "Compte",
    links: [
      { href: "/connexion", label: "Se connecter" },
      { href: "/mot-de-passe-oublie", label: "Mot de passe oublié" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-subtle">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{site.tagline}</p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <p className="text-sm font-semibold">{c.title}</p>
            <ul className="mt-3 grid gap-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href as Route}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © 2026 BookSync. Tous droits réservés. Prix en euros TTC.
        </p>
      </div>
    </footer>
  );
}
