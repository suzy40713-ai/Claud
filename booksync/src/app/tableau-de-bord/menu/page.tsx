import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";
import { groupNavItems } from "@/components/dashboard/nav-config";
import { visibleNavItems } from "@/components/dashboard/visible-nav";
import { NavIcon } from "@/components/dashboard/nav-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABELS } from "@/domain/permissions";
import { requireOrg } from "@/server/auth/session";
import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = { title: "Menu" };

async function Content() {
  const ctx = await requireOrg();
  const groups = groupNavItems(visibleNavItems(ctx.role));
  return (
    <div className="grid gap-5">
      <div className="rounded-xl border bg-card p-4">
        <p className="font-semibold">{ctx.user.name}</p>
        <p className="text-sm text-muted-foreground">
          {ctx.organization.name} · {ROLE_LABELS[ctx.role]}
        </p>
      </div>
      {groups.map((g) => (
        <section key={g.id} aria-label={g.title || "Accueil"}>
          {g.title ? (
            <h2 className="mb-2 px-1 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
              {g.title}
            </h2>
          ) : null}
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {g.items.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href as Route}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent"
                >
                  <NavIcon name={i.icon} className="size-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium">{i.label}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">
                      {i.hint}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
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
