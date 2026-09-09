import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkSearchCredit, consumeSearchCredit } from "@/lib/credits";
import { generateIdeas } from "@/lib/gemini";

const bodySchema = z.object({
  niche: z.string().min(2).max(100),
  platform: z.enum(["tiktok", "instagram", "youtube_shorts"]),
  style: z.enum([
    "educational",
    "storytelling",
    "ranking",
    "debate",
    "humor",
    "news",
    "tutorial",
  ]),
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
  const { niche, platform, style } = parsed.data;

  const creditCheck = await checkSearchCredit(supabase, user.id);
  if (!creditCheck.allowed) {
    return NextResponse.json({ error: creditCheck.reason }, { status: 402 });
  }

  const ideaCount = creditCheck.profile.idea_credits_per_search;

  let generated;
  try {
    generated = await generateIdeas({ niche, platform, style, count: ideaCount });
  } catch (err) {
    console.error("generateIdeas failed", err);
    return NextResponse.json(
      { error: "La génération d'idées a échoué. Réessaie dans un instant." },
      { status: 502 }
    );
  }

  const { data: search, error: searchError } = await supabase
    .from("searches")
    .insert({ user_id: user.id, niche, platform, style, idea_count: ideaCount })
    .select()
    .single();

  if (searchError || !search) {
    return NextResponse.json({ error: "Impossible d'enregistrer la recherche." }, { status: 500 });
  }

  const ideaRows = generated.map((idea) => ({
    search_id: search.id,
    user_id: user.id,
    platform,
    title: idea.title,
    hook: idea.hook,
    concept: idea.concept,
    format: idea.format,
    recommended_duration: idea.recommended_duration,
    audience: idea.audience,
    cta: idea.cta,
    hashtags: idea.hashtags,
    opportunity_score: idea.opportunity_score,
    score_breakdown: idea.score_breakdown,
  }));

  const { data: insertedIdeas, error: ideasError } = await supabase
    .from("ideas")
    .insert(ideaRows)
    .select();

  if (ideasError || !insertedIdeas) {
    return NextResponse.json({ error: "Impossible d'enregistrer les idées." }, { status: 500 });
  }

  const updatedProfile = await consumeSearchCredit(supabase, user.id, "generate_ideas", {
    search_id: search.id,
    niche,
    platform,
    style,
  });

  return NextResponse.json({ ideas: insertedIdeas, profile: updatedProfile });
}
