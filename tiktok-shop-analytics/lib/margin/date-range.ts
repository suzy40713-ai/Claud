import { format, startOfYear, subDays } from "date-fns";
import type { DateRange } from "@/lib/margin/types";

export type PresetKey = "7d" | "30d" | "90d" | "ytd" | "custom";

export const PRESETS: { key: Exclude<PresetKey, "custom">; label: string }[] = [
  { key: "7d", label: "7 derniers jours" },
  { key: "30d", label: "30 derniers jours" },
  { key: "90d", label: "90 derniers jours" },
  { key: "ytd", label: "Cette année" },
];

const ISO_DATE = "yyyy-MM-dd";

export function resolveDateRange(params: {
  from?: string;
  to?: string;
  preset?: string;
}): { range: DateRange; preset: PresetKey } {
  const today = format(new Date(), ISO_DATE);

  if (params.from && params.to) {
    return { range: { from: params.from, to: params.to }, preset: "custom" };
  }

  switch (params.preset) {
    case "7d":
      return { range: { from: format(subDays(new Date(), 6), ISO_DATE), to: today }, preset: "7d" };
    case "90d":
      return { range: { from: format(subDays(new Date(), 89), ISO_DATE), to: today }, preset: "90d" };
    case "ytd":
      return { range: { from: format(startOfYear(new Date()), ISO_DATE), to: today }, preset: "ytd" };
    case "30d":
    default:
      return { range: { from: format(subDays(new Date(), 29), ISO_DATE), to: today }, preset: "30d" };
  }
}
