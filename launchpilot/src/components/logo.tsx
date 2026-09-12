import Link from "next/link";
import { Rocket } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className, iconOnly }: { className?: string; iconOnly?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-sm">
        <Rocket className="h-4 w-4" />
      </span>
      {!iconOnly && <span className="text-base">LaunchPilot</span>}
    </Link>
  );
}
