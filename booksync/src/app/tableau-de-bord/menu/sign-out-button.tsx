"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({ className = "w-full text-destructive", size = "lg" }: { className?: string; size?: "sm" | "md" | "lg" } = {}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      size={size}
      className={className}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut();
          router.replace("/connexion");
          router.refresh();
        })
      }
    >
      {pending ? <Spinner /> : <LogOut />} Se déconnecter
    </Button>
  );
}
