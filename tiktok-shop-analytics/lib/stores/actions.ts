"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface CreateStoreResult {
  error?: string;
}

export async function createStore(
  _prevState: CreateStoreResult,
  formData: FormData,
): Promise<CreateStoreResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Le nom de la boutique est requis." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté." };
  }

  const { error } = await supabase.from("stores").insert({
    user_id: user.id,
    name,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/import");
  revalidatePath("/dashboard");
  return {};
}
