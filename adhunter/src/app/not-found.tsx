import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <p className="font-mono text-sm text-violet-400">404</p>
      <h1 className="text-3xl font-semibold">Cette page est introuvable</h1>
      <p className="max-w-md text-muted-foreground">Le lien est peut-être incorrect ou la page a été déplacée.</p>
      <div className="flex gap-2">
        <Button asChild variant="brand"><Link href="/">Accueil</Link></Button>
        <Button asChild variant="outline"><Link href="/app">Mon espace</Link></Button>
      </div>
    </div>
  );
}
