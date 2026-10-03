import Link from "next/link";
import { Lock, Wrench, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, info }: { title: string; description?: string; actions?: React.ReactNode; info?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">{title}{info}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-violet-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function UpgradeGate({ feature, plan, description }: { feature: string; plan: string; description: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card px-6 py-14 text-center">
      <div className="pointer-events-none absolute inset-0 bg-radial-violet" aria-hidden />
      <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-primary/40 bg-primary/15 text-violet-400">
        <Lock className="h-5 w-5" />
      </div>
      <h2 className="relative mt-4 text-xl font-semibold">{feature} est inclus dans la formule {plan}</h2>
      <p className="relative mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <Button asChild variant="brand" className="relative mt-6">
        <Link href={`/app/billing?plan=${plan.toLowerCase()}`}>Passer à {plan}</Link>
      </Button>
    </div>
  );
}

export function NotConfigured({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
      <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div>
        <p className="font-medium text-warning">{title}</p>
        <div className="mt-1 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-md border border-warning/40 bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning", className)} title="Donnée de démonstration fictive">
      Démo
    </span>
  );
}

export function StatCard({ label, value, hint, icon: Icon, href }: { label: string; value: React.ReactNode; hint?: string; icon: LucideIcon; href?: string }) {
  const inner = (
    <>
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-sm">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="surface card-hover block p-5">{inner}</Link>
  ) : (
    <div className="surface p-5">{inner}</div>
  );
}

export function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const unlimited = limit < 0;
  const pct = unlimited ? 0 : limit === 0 ? 100 : Math.min(100, Math.round((used / limit) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{limit === 0 ? "non inclus" : unlimited ? `${used} / ∞` : `${used} / ${limit}`}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={cn("h-full rounded-full transition-all", pct >= 90 ? "bg-warning" : "bg-primary")} style={{ width: `${unlimited ? 4 : pct}%` }} />
      </div>
    </div>
  );
}
