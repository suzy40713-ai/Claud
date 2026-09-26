import { cn } from "@/lib/utils";

export default function LiveBadge({ className, label = "LIVE" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-live px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white animate-pulse-live",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white" />
      {label}
    </span>
  );
}
