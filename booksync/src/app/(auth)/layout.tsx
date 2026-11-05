import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { redirectIfAuthenticated } from "@/server/auth/session";

async function RedirectIfAuthenticated() {
  return redirectIfAuthenticated();
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col bg-background sm:bg-subtle">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-80 bg-[radial-gradient(50%_70%_at_50%_0%,var(--primary-soft),transparent)] sm:block"
      />
      <Suspense>
        <RedirectIfAuthenticated />
      </Suspense>
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] sm:flex sm:justify-center sm:pt-14">
        <Link href="/" aria-label="BookSync — accueil" className="inline-flex rounded-md">
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 flex-col px-5 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:items-center sm:pt-8">
        <div className="w-full sm:max-w-[420px] sm:rounded-2xl sm:border sm:bg-card sm:p-8 sm:shadow-md">
          {children}
        </div>
      </main>
    </div>
  );
}
