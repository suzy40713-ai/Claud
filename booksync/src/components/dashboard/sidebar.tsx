"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActive, type NavItem } from "./nav-config";
import { NavIcon } from "./nav-icon";

export function SidebarNav({ items, unread }: { items: NavItem[]; unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="grid gap-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href as Route}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-primary-soft-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <NavIcon name={item.icon} />
            <span className="flex-1">{item.label}</span>
            {item.icon === "bell" && unread > 0 ? (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[11px] leading-none font-semibold text-primary-foreground tabular-nums">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTabBar({ items, moreItems }: { items: NavItem[]; moreItems: NavItem[] }) {
  const pathname = usePathname();
  const moreActive = moreItems.some((i) => isActive(pathname, i.href));
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href as Route}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <NavIcon name={item.icon} className="size-5" />
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href={"/tableau-de-bord/menu" as Route}
            aria-current={moreActive ? "page" : undefined}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
              moreActive || pathname === "/tableau-de-bord/menu"
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
            <span>Plus</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
