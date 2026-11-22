"use client";

import { useState } from "react";
import { Video } from "lucide-react";
import { SettingsSection, UpgradeNotice } from "@/components/settings/section";
import { useSave } from "@/components/settings/use-save";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { updateMeetingUrlAction } from "../actions";

/** Rendez-vous en ligne : lien Meet / Zoom fixe, transmis à chaque client (forfait Starter+). */
export function MeetingForm({ allowed, initial }: { allowed: boolean; initial: string }) {
  const [url, setUrl] = useState(initial);
  const { pending, errors, save } = useSave();
  return (
    <SettingsSection
      title="Rendez-vous en visio"
      description="Vous travaillez en ligne (coaching, cours, consultation) ? Collez votre lien Google Meet, Zoom ou Teams : il est envoyé à chaque client dans sa confirmation et ses rappels."
    >
      {!allowed ? (
        <UpgradeNotice feature="Le lien de visio" plan="Starter" />
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save(() => updateMeetingUrlAction(url));
          }}
        >
          <Field
            id="meetingUrl"
            label="Lien de votre salle de visio"
            hint="Votre lien personnel qui ne change pas. Laissez vide si vous recevez vos clients sur place."
            error={errors.meetingUrl}
          >
            <Input
              id="meetingUrl"
              inputMode="url"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="https://meet.google.com/abc-defg-hij"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </Field>
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner /> : <Video />} Enregistrer le lien
            </Button>
          </div>
        </form>
      )}
    </SettingsSection>
  );
}
