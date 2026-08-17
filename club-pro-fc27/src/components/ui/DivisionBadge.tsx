import type { Division } from "@/types";
import { DIVISION_COLOR, DIVISIONS } from "@/lib/constants";
import { Trophy, Medal, Crown, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

function iconFor(division: Division) {
  const rank = DIVISIONS.indexOf(division);
  if (division === "Champions") return Crown;
  if (division === "Élite") return Gem;
  if (rank >= 7) return Trophy;
  return Medal;
}

export default function DivisionBadge({
  division,
  size = "md",
  className,
}: {
  division: Division;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = iconFor(division);
  const iconSize = size === "lg" ? "h-5 w-5" : size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "lg" ? "text-sm" : size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 font-semibold",
        size === "lg" ? "px-3.5 py-1.5" : "px-2.5 py-1",
        textSize,
        DIVISION_COLOR[division],
        className
      )}
    >
      {/* eslint-disable-next-line react-hooks/static-components -- Icon is always one of a fixed set of imported lucide components */}
      <Icon className={iconSize} fill="currentColor" strokeWidth={1} />
      {division}
    </span>
  );
}
