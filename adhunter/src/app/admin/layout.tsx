import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/shared/logo";
import { requireAdmin } from "@/lib/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administration", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAdmin();
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-violet-400">Admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{account.user.email}</span>
            <Link href="/app" className="text-muted-foreground hover:text-foreground">Retour à l'app</Link>
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
