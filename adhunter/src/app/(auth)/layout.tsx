import Link from "next/link";

import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-radial-violet" aria-hidden />
      <header className="container relative flex h-16 items-center justify-between">
        <Logo />
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Retour au site</Link>
      </header>
      <main className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
