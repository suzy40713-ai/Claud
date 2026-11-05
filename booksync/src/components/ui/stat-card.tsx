import * as React from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-xs sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground [&_svg]:size-4">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-[28px]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
