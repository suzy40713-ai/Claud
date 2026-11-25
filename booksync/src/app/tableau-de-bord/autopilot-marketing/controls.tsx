"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Rocket, Square } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { addTaskAction, setTaskDoneAction, startPlanAction, stopPlanAction } from "./actions";

export type TaskView = {
  id: string;
  title: string;
  detail: string;
  channel: string;
  done: boolean;
  dayLabel?: string;
};

export function TaskItem({ task }: { task: TaskView }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(task.done);
  return (
    <li className="flex gap-3 rounded-xl border bg-card p-4" data-testid="marketing-task">
      <Checkbox
        id={`t-${task.id}`}
        checked={done}
        disabled={pending}
        className="mt-1"
        onCheckedChange={(v) =>
          startTransition(async () => {
            setDone(v === true);
            const res = await setTaskDoneAction(task.id, v === true);
            if (!res.ok) toast.error(res.error);
          })
        }
      />
      <label htmlFor={`t-${task.id}`} className="grid flex-1 cursor-pointer gap-1">
        <span className={done ? "font-medium text-muted-foreground line-through" : "font-medium"}>
          {task.title}
        </span>
        <span className="text-sm text-muted-foreground">{task.detail}</span>
        <span className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{task.channel}</Badge>
          {task.dayLabel ? <Badge variant="warning">{task.dayLabel}</Badge> : null}
        </span>
      </label>
    </li>
  );
}

export function StartPlanButton({ strategyId, replace }: { strategyId: string; replace: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      data-testid="start-autopilot"
      disabled={pending}
      onClick={() => {
        if (
          replace &&
          !window.confirm("Un Autopilot est déjà en cours. Le remplacer par cette stratégie ?")
        )
          return;
        startTransition(async () => {
          const res = await startPlanAction(strategyId);
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.message ?? "Autopilot lancé.");
          router.push("/tableau-de-bord/autopilot-marketing");
        });
      }}
    >
      <Rocket /> Lancer l&apos;Autopilot avec cette stratégie
    </Button>
  );
}

export function StopPlanButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Arrêter l'Autopilot ? Vos actions cochées restent enregistrées."))
          return;
        startTransition(async () => {
          const res = await stopPlanAction();
          if (!res.ok) return void toast.error(res.error);
          toast.success("Autopilot arrêté.");
          router.refresh();
        });
      }}
    >
      <Square /> Arrêter l&apos;Autopilot
    </Button>
  );
}

/** Ajout d'une action libre au plan du jour. */
export function AddTaskForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      data-testid="add-task"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await addTaskAction({ title });
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.message ?? "Action ajoutée.");
          setTitle("");
          router.refresh();
        });
      }}
    >
      <Input
        aria-label="Nouvelle action"
        placeholder="Ajouter une action pour aujourd'hui…"
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button type="submit" variant="secondary" disabled={pending || title.trim().length < 3}>
        <Plus /> Ajouter
      </Button>
    </form>
  );
}

/** Bouton « Ajouter à mon plan » sur une recommandation d'un outil. */
export function AddToPlanButton({ title, detail }: { title: string; detail?: string }) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending || added}
      data-testid="add-to-plan"
      onClick={() =>
        startTransition(async () => {
          const res = await addTaskAction({ title, detail });
          if (!res.ok) return void toast.error(res.error);
          setAdded(true);
          toast.success("Ajoutée à votre plan d'action du jour.");
        })
      }
    >
      <Plus /> {added ? "Ajoutée au plan" : "Ajouter à mon plan"}
    </Button>
  );
}
