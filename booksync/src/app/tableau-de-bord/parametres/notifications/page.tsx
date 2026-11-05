import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePermission } from "@/server/auth/session";
import { NotificationSettingsForm } from "./notification-settings-form";

export const metadata: Metadata = { title: "Notifications — Paramètres" };

async function Content() {
  const ctx = await requirePermission("notifications.settings");
  const o = ctx.organization;
  return (
    <NotificationSettingsForm
      features={ctx.plan.features}
      planName={ctx.plan.name}
      initial={{
        notifyStaffOnBooking: o.notifyStaffOnBooking,
        reminder24h: o.reminder24h,
        reminder2h: o.reminder2h,
      }}
    />
  );
}

export default function NotificationSettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Content />
    </Suspense>
  );
}
