"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { LogOut } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await authClient.signOut();
      router.replace("/connexion");
      router.refresh();
    });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label="Menu du compte"
        className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-[13px] font-semibold text-primary-soft-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        {initials(name)}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-[13px] text-muted-foreground">{email}</p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={(e) => {
              e.preventDefault();
              signOut();
            }}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2.5 text-sm outline-none select-none data-highlighted:bg-accent"
          >
            {pending ? <Spinner /> : <LogOut className="size-4" />}
            Se déconnecter
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
