import type { Activity } from "@prisma/client";
import type { ActivityDTO } from "@sports-coach/shared";

export function toActivityDTO(activity: Activity): ActivityDTO {
  const allureMoyenne =
    activity.allureMoyenne ??
    (activity.distance > 0 ? activity.duree / (activity.distance / 1000) : null);

  return {
    id: activity.id,
    date: activity.date.toISOString(),
    sport: activity.sport,
    duree: activity.duree,
    distance: activity.distance,
    denivele: activity.denivele,
    fcMoyenne: activity.fcMoyenne,
    allureMoyenne,
    sourceFormat: activity.sourceFormat,
  };
}
