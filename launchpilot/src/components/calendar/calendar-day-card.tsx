"use client";

import * as React from "react";
import { Check, Clock, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { setActionPlanCompletion } from "@/lib/actions/calendar";
import type { Tables } from "@/types/database";

export function CalendarDayCard({
  day,
  completed: initialCompleted,
}: {
  day: Tables<"action_plans">;
  completed: boolean;
}) {
  const [completed, setCompleted] = React.useState(initialCompleted);
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    setPending(true);
    const next = !completed;
    setCompleted(next);
    const result = await setActionPlanCompletion(day.id, next);
    if (!result.success) {
      setCompleted(!next);
    }
    setPending(false);
  }

  return (
    <Card className={cn("transition-colors", completed && "border-success/40 bg-success/5")}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">Jour {day.day_number}</Badge>
          <Badge variant="outline">{day.platform}</Badge>
        </div>
        <p className="font-semibold leading-snug">{day.objective}</p>
        <p className="text-sm text-muted-foreground">{day.task}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {day.duration_minutes} min
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Résultat attendu : </span>
          {day.expected_result}
        </p>
        <Button
          size="sm"
          variant={completed ? "secondary" : "outline"}
          className="w-full"
          onClick={toggle}
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : completed ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
          {completed ? "Terminé" : "Marquer comme terminé"}
        </Button>
      </CardContent>
    </Card>
  );
}
