import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/lib/env";
import { fileUrl } from "@/lib/files";
import { requirePermission } from "@/server/auth/session";
import { BookingSettingsForm } from "./booking-settings-form";
import { MeetingForm } from "./meeting-form";

export const metadata: Metadata = { title: "Réservation en ligne — Paramètres" };

async function Content() {
  const ctx = await requirePermission("organization.update");
  const o = ctx.organization;
  return (
    <div className="grid gap-8">
      <MeetingForm allowed={ctx.plan.features.onlineMeetings} initial={o.meetingUrl ?? ""} />
      <BookingSettingsForm
        publicUrl={`${env.NEXT_PUBLIC_APP_URL}/${o.slug}`}
        canCustomize={ctx.plan.features.bookingPageCustomization}
        coverUrl={fileUrl(o.coverFileId)}
        initial={{
          bookingEnabled: o.bookingEnabled,
          listed: o.listed,
          minNoticeMinutes: o.minNoticeMinutes,
          maxAdvanceDays: o.maxAdvanceDays,
          slotIntervalMinutes: o.slotIntervalMinutes,
          cancellationNoticeHours: o.cancellationNoticeHours,
        }}
        branding={{ brandColor: o.brandColor ?? "#3563E9", welcomeMessage: o.welcomeMessage ?? "" }}
      />
    </div>
  );
}

export default function BookingSettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[600px]" />}>
      <Content />
    </Suspense>
  );
}
