import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/components/dashboard/nav-config";
import { NavIcon } from "@/components/dashboard/nav-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { can, ROLE_LABELS } from "@/domain/permissions";
import { requireOrg } from "@/server/auth/session";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Menu" };

async function Content() {
  const ctx = await requireOrg();
  const items = NAV_ITEMS.filter((i) => !i.permission || can(ctx.role, i.permission));
  return (
    <div className="grid gap-5">
      <div className="rounded-xl border bg-card p-4">
        <p className="font-semibold">{ctx.user.name}</p>
        <p className="text-sm text-muted-foreground">
          {ctx.organization.name} · {ROLE_LABELS[ctx.role]}
        </p>
      </div>
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href as Route}
              className="flex items-center gap-3 px-4 py-3.5 text-[15px] hover:bg-accent"
            >
              <NavIcon name={i.icon} className="size-5 text-muted-foreground" />
              <span className="flex-1">{i.label}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
      <SignOutButton />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content />
    </Suspense>
  );
}
