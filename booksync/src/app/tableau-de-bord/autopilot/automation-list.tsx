"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { setAutomationAction } from "./actions";

export type AutomationItem = {
  key: string;
  title: string;
  description: string;
  active: boolean;
  enabled: boolean;
  locked: boolean;
  includedInPlan: boolean;
  minPlanName: string;
};

function AutomationRow({ item, canManage }: { item: AutomationItem; canManage: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checked, setChecked] = useOptimistic(item.active);
  const disabled = !canManage || item.locked || !item.includedInPlan || pending;
  return (
    <li
      className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5"
      data-testid="automation"
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {item.title}
          {item.locked ? (
            <Badge variant="neutral">
              <Lock className="size-3" aria-hidden /> Toujours active
            </Badge>
          ) : !item.includedInPlan ? (
            <Badge variant="primary">{item.minPlanName}</Badge>
          ) : null}
        </p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{item.description}</p>
        {!item.includedInPlan ? (
          <Link
            href="/tableau-de-bord/abonnement"
            className="mt-1 inline-block text-[13px] font-medium text-primary hover:underline"
          >
            Inclus dans le forfait {item.minPlanName} →
          </Link>
        ) : null}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        aria-label={item.title}
        onCheckedChange={(value) =>
          startTransition(async () => {
            setChecked(value);
            const res = await setAutomationAction(item.key, value);
            if (res.ok) toast.success(res.message);
            else toast.error(res.error);
            router.refresh();
          })
        }
      />
    </li>
  );
}

export function AutomationList({
  title,
  items,
  canManage,
  empty,
}: {
  title: string;
  items: AutomationItem[];
  canManage: boolean;
  empty: string;
}) {
  return (
    <section className="grid content-start gap-3">
      <h2 className="text-[15px] font-semibold">
        {title} <span className="text-muted-foreground">({items.length})</span>
      </h2>
      {items.length ? (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-xs">
          {items.map((i) => (
            <AutomationRow key={i.key} item={i} canManage={canManage} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      )}
    </section>
  );
}
