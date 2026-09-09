export type Plan = "free" | "creator" | "pro";
export type Platform = "tiktok" | "instagram" | "youtube_shorts";
export type ContentStyle =
  | "educational"
  | "storytelling"
  | "ranking"
  | "debate"
  | "humor"
  | "news"
  | "tutorial";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  search_credits: number;
  idea_credits_per_search: number;
  credits_reset_at: string;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  search_id: string | null;
  user_id: string;
  platform: Platform;
  title: string;
  hook: string;
  concept: string;
  format: string | null;
  recommended_duration: string | null;
  audience: string | null;
  cta: string | null;
  hashtags: string[];
  opportunity_score: number;
  score_breakdown: Record<string, number>;
  is_saved: boolean;
  created_at: string;
}

export interface ScriptRecord {
  id: string;
  idea_id: string | null;
  user_id: string;
  hook: string | null;
  introduction: string | null;
  development: string | null;
  conclusion: string | null;
  cta: string | null;
  estimated_duration: string | null;
  narration_notes: string | null;
  on_screen_text: string | null;
  visual_ideas: string | null;
  version: number;
  created_at: string;
}

export interface CalendarEntry {
  id: string;
  user_id: string;
  idea_id: string | null;
  title: string;
  scheduled_date: string;
  status: "planned" | "in_progress" | "published";
  notes: string | null;
  created_at: string;
}

export interface RadarSignal {
  id: string;
  niche: string;
  platform: Platform | "all";
  category: "trending" | "rising" | "watch" | "opportunity";
  title: string;
  description: string | null;
  source: "ai_estimate" | "google_trends" | "social_api" | "manual";
  confidence: number;
  created_at: string;
}

// These interfaces describe the shape of each table's rows for use in app
// code (cast query results with `as Profile`, `as Idea[]`, etc). The Supabase
// clients are intentionally untyped generically — run
// `supabase gen types typescript` once the project is linked for full
// query-builder type safety end to end.
