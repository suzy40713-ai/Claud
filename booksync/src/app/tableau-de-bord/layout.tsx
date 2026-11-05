import { Suspense } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireOrganization } from "@/server/auth/session";
import { UserMenu } from "./user-menu";

async function OrgHeader() {
  const { session, organization } = await requireOrganization();
  return (
    <>
      <div className="flex min-w-0 items-center gap-2.5">
        <Link href="/tableau-de-bord" aria-label="Tableau de bord" className="rounded-md">
          <LogoMark />
        </Link>
        <span className="text-muted-foreground/60" aria-hidden>
          /
        </span>
        <span className="truncate text-sm font-medium" data-testid="org-name">
          {organization.name}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu name={session.user.name} email={session.user.email} />
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-subtle">
      <header className="sticky top-0 z-30 border-b bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Suspense fallback={<div className="h-7 w-40 animate-pulse rounded-md bg-muted" />}>
            <OrgHeader />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
