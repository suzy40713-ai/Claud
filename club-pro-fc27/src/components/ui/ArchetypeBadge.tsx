import type { Archetype } from "@/types";
import { ARCHETYPE_ICONS } from "@/lib/constants";
import DynamicIcon from "./DynamicIcon";
import { cn } from "@/lib/utils";

export default function ArchetypeBadge({
  archetype,
  size = "md",
  className,
}: {
  archetype: Archetype;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 font-semibold text-accent",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      <DynamicIcon name={ARCHETYPE_ICONS[archetype]} className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {archetype}
    </span>
  );
}
