import { connection } from "next/server";
import { sql } from "@/db/client";
import { checkDatabase } from "@/db/health";
import { cn } from "@/lib/utils";

export async function SystemStatus() {
  await connection();
  const health = await checkDatabase(sql);
  return (
    <div
      data-testid="system-status"
      data-ok={health.ok}
      className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm shadow-xs"
    >
      <span className="flex items-center gap-2">
        <span
          className={cn("size-2 rounded-full", health.ok ? "bg-success" : "bg-destructive")}
          aria-hidden
        />
        {health.ok ? "Tous les systèmes sont opérationnels" : "Base de données indisponible"}
      </span>
      <span className="font-mono text-xs text-muted-foreground tabular-nums">
        {health.latencyMs} ms
      </span>
    </div>
  );
}

export function SystemStatusSkeleton() {
  return <div className="h-[46px] animate-pulse rounded-lg border bg-muted" />;
}
