"use server";

import { revalidatePath } from "next/cache";
import { setLessonDone } from "@/server/academy/progress";
import { requireOrg } from "@/server/auth/session";
import { runAction } from "@/server/errors";

export async function setLessonDoneAction(lessonId: string, done: boolean) {
  const ctx = await requireOrg();
  const res = await runAction(() => setLessonDone(ctx, lessonId, done));
  revalidatePath("/tableau-de-bord", "layout");
  return res;
}
