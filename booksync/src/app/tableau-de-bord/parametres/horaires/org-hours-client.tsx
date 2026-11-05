"use client";

import { TimeOffManager } from "@/components/schedule/time-off-manager";
import { WeekEditor } from "@/components/schedule/week-editor";
import type { WeeklyHours } from "@/domain/schedule/hours";
import { addTimeOffAction, removeTimeOffAction, saveHoursAction } from "../../schedule-actions";

type Props =
  | { kind: "hours"; week: WeeklyHours }
  | {
      kind: "closures";
      timeZone: string;
      closures: { id: string; startsAt: string; endsAt: string; reason: string | null }[];
    };

export function OrgHoursClient(props: Props) {
  if (props.kind === "hours") {
    return <WeekEditor initial={props.week} onSave={(w) => saveHoursAction(null, w)} />;
  }
  return (
    <TimeOffManager
      items={props.closures}
      timeZone={props.timeZone}
      emptyLabel="Aucune fermeture prévue."
      addLabel="Ajouter une fermeture"
      onAdd={(input) => addTimeOffAction(null, input)}
      onRemove={removeTimeOffAction}
    />
  );
}
