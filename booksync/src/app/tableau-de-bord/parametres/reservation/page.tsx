import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/lib/env";
import { fileUrl } from "@/lib/files";
import { requirePermission } from "@/server/auth/session";
import { BookingSettingsForm } from "./booking-settings-form";

export const metadata: Metadata = { title: "Réservation en ligne — Paramètres" };

async function Content() {
  const ctx = await requirePermission("organization.update");
  const o = ctx.organization;
  return (
    <BookingSettingsForm
      publicUrl={`${env.NEXT_PUBLIC_APP_URL}/${o.slug}`}
      canCustomize={ctx.plan.features.bookingPageCustomization}
      coverUrl={fileUrl(o.coverFileId)}
      initial={{
        bookingEnabled: o.bookingEnabled,
        minNoticeMinutes: o.minNoticeMinutes,
        maxAdvanceDays: o.maxAdvanceDays,
        slotIntervalMinutes: o.slotIntervalMinutes,
        cancellationNoticeHours: o.cancellationNoticeHours,
      }}
      branding={{ brandColor: o.brandColor ?? "#3563E9", welcomeMessage: o.welcomeMessage ?? "" }}
    />
  );
}

export default function BookingSettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <Content />
    </Suspense>
  );
}
