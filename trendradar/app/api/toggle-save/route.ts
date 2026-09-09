import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SAVE_LIMIT_FREE } from "@/lib/plans";
import type { Profile } from "@/lib/supabase/types";

const bodySchema = z.object({
  ideaId: z.string().uuid(),
  save: z.boolean(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { ideaId, save } = parsed.data;

  if (save) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile && (profile as Profile).plan === "free") {
      const { count } = await supabase
        .from("ideas")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_saved", true);

      if ((count || 0) >= SAVE_LIMIT_FREE) {
        return NextResponse.json(
          {
            error: `Le plan Free est limité à ${SAVE_LIMIT_FREE} idées sauvegardées. Passe à Creator pour des sauvegardes illimitées.`,
          },
          { status: 403 }
        );
      }
    }
  }

  const { data: idea, error } = await supabase
    .from("ideas")
    .update({ is_saved: save })
    .eq("id", ideaId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !idea) {
    return NextResponse.json({ error: "Idée introuvable." }, { status: 404 });
  }

  return NextResponse.json({ idea });
}
