"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setLessonDoneAction } from "../actions";

export function LessonDoneButton({ lessonId, done }: { lessonId: string; done: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useOptimistic(done);
  return (
    <Button
      variant={state ? "secondary" : "primary"}
      disabled={pending}
      data-testid="lesson-done"
      onClick={() =>
        startTransition(async () => {
          setState(!state);
          const res = await setLessonDoneAction(lessonId, !state);
          if (!res.ok) return void toast.error(res.error);
          if (!state) toast.success("Leçon terminée, bravo !");
          router.refresh();
        })
      }
    >
      <CheckCircle2 /> {state ? "Terminée" : "J'ai terminé cette leçon"}
    </Button>
  );
}
