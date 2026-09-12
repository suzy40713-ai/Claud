import Link from "next/link";

import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo />
        <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} LaunchPilot. Tous droits réservés.</p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link href="/login" className="hover:text-foreground">
            Se connecter
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Créer un compte
          </Link>
        </div>
      </div>
    </footer>
  );
}
