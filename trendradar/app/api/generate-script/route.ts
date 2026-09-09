import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateScript } from "@/lib/gemini";
import { getPlan } from "@/lib/plans";
import type { Profile } from "@/lib/supabase/types";

const bodySchema = z.object({
  ideaId: z.string().uuid(),
  platform: z.enum(["tiktok", "instagram", "youtube_shorts"]),
  mode: z.enum(["default", "captivating", "shorter", "suspense", "alternative"]).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !getPlan((profile as Profile).plan).hasScriptGeneration) {
    return NextResponse.json(
      { error: "La génération de scripts est réservée aux plans Creator et Pro." },
      { status: 403 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { ideaId, platform, mode } = parsed.data;

  const { data: idea, error: ideaError } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", ideaId)
    .eq("user_id", user.id)
    .single();

  if (ideaError || !idea) {
    return NextResponse.json({ error: "Idée introuvable." }, { status: 404 });
  }

  let script;
  try {
    script = await generateScript({
      idea: { title: idea.title, hook: idea.hook, concept: idea.concept, cta: idea.cta },
      platform,
      mode,
    });
  } catch (err) {
    console.error("generateScript failed", err);
    return NextResponse.json({ error: "La génération du script a échoué." }, { status: 502 });
  }

  const { count: existingCount } = await supabase
    .from("scripts")
    .select("id", { count: "exact", head: true })
    .eq("idea_id", ideaId);

  const { data: saved, error: saveError } = await supabase
    .from("scripts")
    .insert({
      idea_id: ideaId,
      user_id: user.id,
      hook: script.hook,
      introduction: script.introduction,
      development: script.development,
      conclusion: script.conclusion,
      cta: script.cta,
      estimated_duration: script.estimated_duration,
      narration_notes: script.narration_notes,
      on_screen_text: script.on_screen_text,
      visual_ideas: script.visual_ideas,
      version: (existingCount || 0) + 1,
    })
    .select()
    .single();

  if (saveError || !saved) {
    return NextResponse.json({ error: "Impossible d'enregistrer le script." }, { status: 500 });
  }

  return NextResponse.json({ script: saved });
}
