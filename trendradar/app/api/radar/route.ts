import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateRadarSignals } from "@/lib/gemini";

const bodySchema = z.object({
  niche: z.string().min(2).max(100),
  platform: z.enum(["tiktok", "instagram", "youtube_shorts", "all"]),
});

/**
 * Radar signals are AI qualitative estimates, not real-time trend data.
 * We cache them per niche+platform for a day to avoid re-generating (and
 * re-billing Gemini calls) on every page view; swap this for a real
 * Google Trends / social API pull later without changing the contract.
 */
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
  const { niche, platform } = parsed.data;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("radar_signals")
    .select("*")
    .ilike("niche", niche)
    .eq("platform", platform)
    .gte("created_at", oneDayAgo);

  if (cached && cached.length > 0) {
    return NextResponse.json({ signals: cached, cached: true });
  }

  let signals;
  try {
    signals = await generateRadarSignals({ niche, platform });
  } catch (err) {
    console.error("generateRadarSignals failed", err);
    return NextResponse.json({ error: "Le radar a échoué. Réessaie." }, { status: 502 });
  }

  const rows = signals.map((s) => ({
    niche,
    platform,
    category: s.category,
    title: s.title,
    description: s.description,
    source: "ai_estimate" as const,
    confidence: s.confidence,
  }));

  const { data: inserted, error } = await supabase
    .from("radar_signals")
    .insert(rows)
    .select();

  if (error || !inserted) {
    return NextResponse.json({ error: "Impossible d'enregistrer le radar." }, { status: 500 });
  }

  return NextResponse.json({ signals: inserted, cached: false });
}
