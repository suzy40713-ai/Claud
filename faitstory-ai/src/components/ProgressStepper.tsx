import type { VideoStatus } from "@/generated/prisma/enums";
import { PIPELINE_STEPS } from "@/lib/types";

export function ProgressStepper({ status }: { status: VideoStatus }) {
  const currentIndex = PIPELINE_STEPS.findIndex((step) => step.status === status);

  return (
    <ol className="space-y-3">
      {PIPELINE_STEPS.map((step, index) => {
        const done = currentIndex > index || status === "DONE";
        const active = currentIndex === index && status !== "DONE";
        return (
          <li key={step.status} className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-success/20 text-success"
                  : active
                    ? "bg-accent text-white animate-pulse"
                    : "bg-surface-hover text-muted"
              }`}
            >
              {done ? "✓" : index + 1}
            </span>
            <span className={done || active ? "text-foreground" : "text-muted"}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
