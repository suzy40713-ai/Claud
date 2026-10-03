import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function FormMessage({ type, children, className }: { type: "error" | "success" | "info"; children: React.ReactNode; className?: string }) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-2 rounded-lg border px-3 py-2.5 text-sm",
        type === "error" && "border-destructive/40 bg-destructive/10 text-destructive",
        type === "success" && "border-success/40 bg-success/10 text-success",
        type === "info" && "border-primary/30 bg-primary/10 text-violet-400",
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
