import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { analyzeIdea } from "@/lib/gemini";
import { checkSearchCredit, consumeSearchCredit } from "@/lib/credits";

const bodySchema = z.object({
  idea: z.string().min(10).max(1000),
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
    return NextResponse.json(
      { error: "Décris ton idée en au moins quelques mots." },
      { status: 400 }
    );
  }

  const creditCheck = await checkSearchCredit(supabase, user.id);
  if (!creditCheck.allowed) {
    return NextResponse.json({ error: creditCheck.reason }, { status: 402 });
  }

  let analysis;
  try {
    analysis = await analyzeIdea(parsed.data.idea);
  } catch (err) {
    console.error("analyzeIdea failed", err);
    return NextResponse.json({ error: "L'analyse a échoué. Réessaie." }, { status: 502 });
  }

  const { data: saved, error } = await supabase
    .from("idea_analyses")
    .insert({
      user_id: user.id,
      raw_idea: parsed.data.idea,
      overall_score: analysis.overall_score,
      curiosity_score: analysis.curiosity_score,
      clarity_score: analysis.clarity_score,
      originality_score: analysis.originality_score,
      retention_score: analysis.retention_score,
      share_score: analysis.share_score,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      improved_versions: analysis.improved_versions,
    })
    .select()
    .single();

  if (error || !saved) {
    return NextResponse.json({ error: "Impossible d'enregistrer l'analyse." }, { status: 500 });
  }

  const updatedProfile = await consumeSearchCredit(supabase, user.id, "analyze_idea");

  return NextResponse.json({ analysis: saved, profile: updatedProfile });
}
