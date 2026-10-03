import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { MobileNav } from "@/components/app/mobile-nav";
import { OnboardingTour } from "@/components/app/onboarding-tour";
import { SidebarContent } from "@/components/app/sidebar";
import { UserMenu } from "@/components/app/user-menu";
import { requireAccount } from "@/lib/account";
import { isDemoMode } from "@/lib/env";
import { claimPendingInvitations } from "@/lib/teams";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAccount("/app");
  await claimPendingInvitations(account);
  const features = account.plan.features as string[];
  const sub = account.subscription;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-background lg:block">
        <SidebarContent features={features} isAdmin={account.isAdmin} />
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <MobileNav features={features} isAdmin={account.isAdmin} />
          <div className="flex flex-1 items-center gap-2">
            {isDemoMode() && (
              <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-xs text-warning" title="Certaines données sont fictives">
                Mode démo<span className="hidden sm:inline"> — certaines données sont fictives</span>
              </span>
            )}
          </div>
          <Link href="/app/billing" className="hidden rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground sm:block">
            Formule <span className="text-violet-400">{account.plan.name}</span>
          </Link>
          <UserMenu email={account.user.email} name={account.profile.full_name} planName={account.plan.name} isAdmin={account.isAdmin} />
        </header>
        {sub?.status === "past_due" && (
          <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning sm:px-6">
            <AlertTriangle className="h-4 w-4" />
            Ton dernier paiement a échoué. <Link href="/app/billing" className="underline">Mets à jour ton moyen de paiement</Link> pour conserver ton accès.
          </div>
        )}
        {sub?.cancel_at_period_end && sub.current_period_end && (
          <div className="border-b border-border bg-card px-4 py-2 text-sm text-muted-foreground sm:px-6">
            Ton abonnement {account.plan.name} prendra fin le {formatDate(sub.current_period_end)}. <Link href="/app/billing" className="text-foreground underline">Le réactiver</Link>
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
      {!account.profile.tutorial_completed && <OnboardingTour />}
    </div>
  );
}
