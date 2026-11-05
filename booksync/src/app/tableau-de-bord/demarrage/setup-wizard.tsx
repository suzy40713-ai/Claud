"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronDown, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/ui/copy-button";
import { Spinner } from "@/components/ui/spinner";
import { WeekEditor } from "@/components/schedule/week-editor";
import type { WeeklyHours } from "@/domain/schedule/hours";
import { cn } from "@/lib/utils";
import type { SetupStep } from "@/server/onboarding";
import { addSuggestedServicesAction, finishSetupAction, saveSetupHoursAction } from "./actions";

export function SetupWizard({
  steps,
  week,
  activityLabel,
  suggestions,
  publicUrl,
}: {
  steps: SetupStep[];
  week: WeeklyHours;
  activityLabel: string;
  suggestions: string[];
  publicUrl: string;
}) {
  const router = useRouter();
  const firstOpen = steps.find((s) => !s.done)?.key ?? "page";
  const [open, setOpen] = useState<string>(firstOpen);
  const [applyToMe, setApplyToMe] = useState(true);
  const [pending, startTransition] = useTransition();
  const done = steps.filter((s) => s.done).length;

  return (
    <div className="grid max-w-3xl gap-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progression</span>
          <span className="text-muted-foreground tabular-nums">
            {done} / {steps.length}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${(done / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="grid gap-3">
        {steps.map((s, i) => {
          const isOpen = open === s.key;
          return (
            <li
              key={s.key}
              className="overflow-hidden rounded-xl border bg-card"
              data-testid={`setup-${s.key}`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? "" : s.key)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
              >
                <span
                  className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    s.done ? "bg-success text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {s.done ? <Check className="size-4" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">
                    {s.title}{" "}
                    {s.optional ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        (facultatif)
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-[13px] text-muted-foreground">{s.description}</span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen ? (
                <div className="border-t px-4 py-4 sm:px-5">
                  {s.key === "hours" ? (
                    <div className="grid gap-3">
                      <WeekEditor
                        initial={week}
                        saveLabel="Enregistrer et continuer"
                        onSave={(w) => saveSetupHoursAction(w, applyToMe)}
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={applyToMe}
                          onCheckedChange={(c) => setApplyToMe(c === true)}
                        />
                        Appliquer aussi ces horaires à mon propre planning
                      </label>
                    </div>
                  ) : s.key === "services" ? (
                    <div className="grid gap-3">
                      {!s.done && suggestions.length ? (
                        <div className="rounded-lg border border-dashed p-4">
                          <p className="text-sm">
                            Suggestions pour <strong>{activityLabel.toLowerCase()}</strong> :{" "}
                            {suggestions.join(", ")}.
                          </p>
                          <Button
                            className="mt-3"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                const res = await addSuggestedServicesAction();
                                if (res.ok) toast.success(res.message);
                                else toast.error(res.error);
                                router.refresh();
                              })
                            }
                          >
                            {pending ? <Spinner /> : <Sparkles />} Ajouter ces prestations
                          </Button>
                        </div>
                      ) : null}
                      <Button asChild variant="secondary" className="justify-self-start">
                        <Link href={s.href as Route}>
                          {s.done ? "Gérer mes services" : "Créer mes propres services"}
                        </Link>
                      </Button>
                    </div>
                  ) : s.key === "page" ? (
                    <div className="grid gap-3">
                      <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-subtle px-3 py-2">
                        <span className="min-w-0 flex-1 truncate font-mono text-[13px]">
                          {publicUrl}
                        </span>
                        <CopyButton value={publicUrl} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="secondary">
                          <a href={publicUrl} target="_blank" rel="noreferrer">
                            <ExternalLink /> Voir ma page
                          </a>
                        </Button>
                        <Button asChild variant="ghost">
                          <Link href="/tableau-de-bord/parametres/reservation">
                            Règles de réservation
                          </Link>
                        </Button>
                      </div>
                      <form action={finishSetupAction}>
                        <Button type="submit" size="lg" className="mt-2 w-full sm:w-auto">
                          <Check /> Terminer l&apos;installation
                        </Button>
                      </form>
                    </div>
                  ) : (
                    <Button asChild variant="secondary">
                      <Link href={s.href as Route}>Ouvrir</Link>
                    </Button>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <Button asChild variant="ghost" className="justify-self-start">
        <Link href="/tableau-de-bord">Plus tard</Link>
      </Button>
    </div>
  );
}
