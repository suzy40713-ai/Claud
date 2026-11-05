import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { MobileTabBar, SidebarNav } from "@/components/dashboard/sidebar";
import { NAV_ITEMS } from "@/components/dashboard/nav-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { can } from "@/domain/permissions";
import { requireOrg } from "@/server/auth/session";
import { countUnread } from "@/server/notifications/unread";
import { PlanBadge } from "@/components/dashboard/plan-badge";
import { UserMenu } from "./user-menu";

async function visibleItems() {
  const ctx = await requireOrg();
  return { ctx, items: NAV_ITEMS.filter((i) => !i.permission || can(ctx.role, i.permission)) };
}

async function Sidebar() {
  const { ctx, items } = await visibleItems();
  const unread = await countUnread(ctx);
  return (
    <>
      <div className="flex items-center gap-2 px-2.5 pb-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold" data-testid="org-name">
            {ctx.organization.name}
          </p>
          <PlanBadge plan={ctx.plan.id} />
        </div>
      </div>
      <SidebarNav items={items} unread={unread} />
    </>
  );
}

async function TopBarRight() {
  const ctx = await requireOrg();
  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />
      <UserMenu
        name={ctx.user.name}
        email={ctx.user.email}
        memberships={ctx.memberships.map((m) => ({ id: m.organizationId, name: m.organizationName }))}
        activeOrganizationId={ctx.organization.id}
      />
    </div>
  );
}

async function MobileOrgName() {
  const ctx = await requireOrg();
  return <span className="truncate text-sm font-semibold">{ctx.organization.name}</span>;
}

async function MobileTabs() {
  const { items } = await visibleItems();
  const mobile = items.filter((i) => i.mobile).slice(0, 4);
  return <MobileTabBar items={mobile} moreItems={items.filter((i) => !mobile.includes(i))} />;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-subtle lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-background px-3 py-4 lg:flex">
        <Link href="/tableau-de-bord" className="mb-6 inline-flex rounded-md px-2.5" aria-label="BookSync — vue générale">
          <Logo />
        </Link>
        <Suspense fallback={<div className="mx-2.5 h-64 animate-pulse rounded-lg bg-muted" />}>
          <Sidebar />
        </Suspense>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <Link href="/tableau-de-bord" className="flex min-w-0 items-center gap-2 lg:hidden" aria-label="Vue générale">
              <Logo className="[&>span:last-child]:hidden" />
              <Suspense>
                <MobileOrgName />
              </Suspense>
            </Link>
            <div className="hidden lg:block" />
            <Suspense fallback={<div className="size-9 animate-pulse rounded-full bg-muted" />}>
              <TopBarRight />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 sm:px-6 sm:pt-8 lg:pb-12">{children}</main>
      </div>
      <Suspense>
        <MobileTabs />
      </Suspense>
    </div>
  );
}
