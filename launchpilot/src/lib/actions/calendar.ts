"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function setActionPlanCompletion(actionPlanId: string, completed: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié." };
  }

  const { error } = await supabase.from("action_progress").upsert(
    {
      user_id: user.id,
      action_plan_id: actionPlanId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,action_plan_id" }
  );

  if (error) {
    return { success: false, error: "Impossible de mettre à jour cette action." };
  }

  revalidatePath("/dashboard/calendrier");
  revalidatePath("/dashboard");

  return { success: true };
}
