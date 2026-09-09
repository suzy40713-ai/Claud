import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateVariants } from "@/lib/gemini";
import { getPlan } from "@/lib/plans";
import type { Profile } from "@/lib/supabase/types";

const bodySchema = z.object({
  ideaId: z.string().uuid(),
  platform: z.enum(["tiktok", "instagram", "youtube_shorts"]),
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

  if (!profile || !getPlan((profile as Profile).plan).hasVariants) {
    return NextResponse.json(
      { error: "Les variantes d'idées sont réservées aux plans Creator et Pro." },
      { status: 403 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { ideaId, platform } = parsed.data;

  const { data: idea, error: ideaError } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", ideaId)
    .eq("user_id", user.id)
    .single();

  if (ideaError || !idea) {
    return NextResponse.json({ error: "Idée introuvable." }, { status: 404 });
  }

  let variants;
  try {
    variants = await generateVariants({
      idea: { title: idea.title, hook: idea.hook, concept: idea.concept },
      platform,
      count: 5,
    });
  } catch (err) {
    console.error("generateVariants failed", err);
    return NextResponse.json({ error: "La génération des variantes a échoué." }, { status: 502 });
  }

  const variantRows = variants.map((v) => ({
    search_id: idea.search_id,
    user_id: user.id,
    platform,
    title: v.title,
    hook: v.hook,
    concept: v.concept,
    format: v.format,
    recommended_duration: v.recommended_duration,
    audience: v.audience,
    cta: v.cta,
    hashtags: v.hashtags,
    opportunity_score: v.opportunity_score,
    score_breakdown: v.score_breakdown,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("ideas")
    .insert(variantRows)
    .select();

  if (insertError || !inserted) {
    return NextResponse.json({ error: "Impossible d'enregistrer les variantes." }, { status: 500 });
  }

  return NextResponse.json({ ideas: inserted });
}
