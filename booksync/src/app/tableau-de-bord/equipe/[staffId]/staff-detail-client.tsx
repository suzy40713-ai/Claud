"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/settings/image-upload";
import { SettingsSection } from "@/components/settings/section";
import { useSave } from "@/components/settings/use-save";
import { TimeOffManager } from "@/components/schedule/time-off-manager";
import { WeekEditor } from "@/components/schedule/week-editor";
import type { WeeklyHours } from "@/domain/schedule/hours";
import { formatDuration } from "@/lib/format";
import {
  addTimeOffAction,
  removeTimeOffAction,
  saveHoursAction,
  setStaffPhotoAction,
  setStaffServicesAction,
  updateStaffProfileAction,
} from "../../schedule-actions";

const COLORS = ["#3563E9", "#7C3AED", "#DB2777", "#EA580C", "#16A34A", "#0891B2", "#CA8A04", "#475467"];

export function StaffDetailClient({
  staffId,
  timeZone,
  canManageAll,
  profile,
  week,
  services,
  serviceIds,
  absences,
}: {
  staffId: string;
  timeZone: string;
  canManageAll: boolean;
  profile: { displayName: string; bio: string; color: string; isBookable: boolean; photoUrl: string | null };
  week: WeeklyHours;
  services: { id: string; name: string; durationMinutes: number }[];
  serviceIds: string[];
  absences: { id: string; startsAt: string; endsAt: string; reason: string | null }[];
}) {
  const [p, setP] = useState(profile);
  const [selected, setSelected] = useState(new Set(serviceIds));
  const profileSave = useSave();
  const servicesSave = useSave();

  return (
    <>
      <SettingsSection title="Profil" description="Visible par vos clients sur la page de réservation.">
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            profileSave.save(() =>
              updateStaffProfileAction(staffId, { displayName: p.displayName, bio: p.bio, color: p.color, isBookable: p.isBookable }),
            );
          }}
        >
          <ImageUpload
            label="Photo"
            shape="round"
            url={p.photoUrl}
            onUpload={(fd) => setStaffPhotoAction(staffId, fd)}
            onRemove={() => setStaffPhotoAction(staffId, new FormData())}
          />
          <Field id="displayName" label="Nom affiché" error={profileSave.errors.displayName}>
            <Input id="displayName" value={p.displayName} onChange={(e) => setP({ ...p, displayName: e.target.value })} />
          </Field>
          <Field id="bio" label="Présentation (facultatif)" error={profileSave.errors.bio}>
            <Textarea id="bio" value={p.bio} maxLength={300} onChange={(e) => setP({ ...p, bio: e.target.value })} placeholder="Spécialités, expérience…" />
          </Field>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Couleur dans le calendrier</legend>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Couleur ${c}`}
                  aria-pressed={p.color.toLowerCase() === c.toLowerCase()}
                  onClick={() => setP({ ...p, color: c })}
                  className="size-8 rounded-full ring-offset-2 ring-offset-card outline-none aria-pressed:ring-2 aria-pressed:ring-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </fieldset>
          {canManageAll ? (
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-medium">Réservable en ligne</span>
                <span className="block text-[13px] text-muted-foreground">Apparaît sur la page de réservation et reçoit des rendez-vous.</span>
              </span>
              <Switch checked={p.isBookable} onCheckedChange={(c) => setP({ ...p, isBookable: c })} aria-label="Réservable en ligne" />
            </label>
          ) : null}
          <Button type="submit" disabled={profileSave.pending} className="sm:justify-self-end">
            {profileSave.pending ? <Spinner /> : null}
            Enregistrer le profil
          </Button>
        </form>
      </SettingsSection>

      {canManageAll ? (
        <SettingsSection title="Services réalisés" description="Les prestations que cette personne peut recevoir en réservation.">
          {services.length ? (
            <div className="grid gap-4">
              <ul className="grid gap-1">
                {services.map((s) => (
                  <li key={s.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent">
                      <Checkbox
                        checked={selected.has(s.id)}
                        onCheckedChange={(c) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (c) next.add(s.id);
                            else next.delete(s.id);
                            return next;
                          })
                        }
                      />
                      <span className="flex-1 text-sm">{s.name}</span>
                      <span className="text-[13px] text-muted-foreground">{formatDuration(s.durationMinutes)}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <Button
                disabled={servicesSave.pending}
                onClick={() => servicesSave.save(() => setStaffServicesAction(staffId, [...selected]))}
                className="sm:justify-self-end"
              >
                {servicesSave.pending ? <Spinner /> : null}
                Enregistrer les services
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Créez d&apos;abord vos services dans l&apos;onglet Services.</p>
          )}
        </SettingsSection>
      ) : null}

      <SettingsSection title="Horaires de travail" description="Plusieurs plages dans une journée créent une pause entre elles.">
        <WeekEditor initial={week} onSave={(w) => saveHoursAction(staffId, w)} />
      </SettingsSection>

      <SettingsSection title="Absences et jours de repos" description="Congés, formation, rendez-vous personnel…">
        <TimeOffManager
          items={absences}
          timeZone={timeZone}
          emptyLabel="Aucune absence prévue."
          addLabel="Ajouter une absence"
          onAdd={(input) => addTimeOffAction(staffId, input)}
          onRemove={removeTimeOffAction}
        />
      </SettingsSection>
    </>
  );
}
