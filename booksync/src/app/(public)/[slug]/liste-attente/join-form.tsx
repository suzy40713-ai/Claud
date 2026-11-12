"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { joinWaitlistAction } from "./actions";

export function JoinForm({
  slug,
  services,
  staff,
  today,
  maxDate,
  initialServiceId,
}: {
  slug: string;
  services: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; name: string }>;
  today: string;
  maxDate: string;
  initialServiceId?: string;
}) {
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <div className="flex flex-col items-center py-6 text-center" data-testid="waitlist-joined">
        <CheckCircle2 className="mb-3 size-10 text-success" />
        <h2 className="text-lg font-semibold">Vous êtes inscrit !</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Dès qu&apos;un créneau correspondant se libère, vous recevez un email. Le premier qui
          confirme obtient le rendez-vous.
        </p>
      </div>
    );
  }
  return (
    <WaitlistForm
      services={services}
      staff={staff}
      today={today}
      maxDate={maxDate}
      initialServiceId={initialServiceId}
      submitLabel="M'inscrire sur la liste d'attente"
      honeypot
      onSubmit={(values) => joinWaitlistAction(slug, values)}
      onDone={() => setDone(true)}
    />
  );
}
