import { NextResponse } from "next/server";

import { getAccount } from "@/lib/account";
import { logError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

/** GDPR data portability: everything we store about the signed-in user. */
export async function GET() {
  const account = await getAccount();
  if (!account) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const supabase = await createClient();
    const uid = account.user.id;
    const [profile, subscription, searches, saved, collections, items, analyses, creations, usage, views] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("subscriptions").select("plan, status, current_period_end, cancel_at_period_end, source, updated_at").eq("user_id", uid).maybeSingle(),
      supabase.from("searches").select("query, niche, filters, sources, results_count, created_at").eq("user_id", uid),
      supabase.from("saved_ads").select("note, niche, created_at, ad:ads(source, source_ad_id, advertiser, title, source_url)").eq("user_id", uid),
      supabase.from("collections").select("id, name, description, niche, created_at").eq("user_id", uid),
      supabase.from("collection_items").select("collection_id, note, created_at, ad:ads(source, source_ad_id, advertiser)").eq("added_by", uid),
      supabase.from("ai_analyses").select("result, model, is_demo, created_at, ad:ads(source, source_ad_id, advertiser)").eq("user_id", uid),
      supabase.from("ai_creations").select("title, input, result, model, is_demo, created_at, updated_at").eq("user_id", uid),
      supabase.from("usage_events").select("kind, created_at").eq("user_id", uid),
      supabase.from("ad_views").select("viewed_at, ad:ads(source, source_ad_id, advertiser)").eq("user_id", uid),
    ]);
    const body = {
      exported_at: new Date().toISOString(),
      account: { id: uid, email: account.user.email },
      profile: profile.data,
      subscription: subscription.data,
      searches: searches.data,
      favorites: saved.data,
      collections: collections.data,
      collection_items: items.data,
      ai_analyses: analyses.data,
      ai_creations: creations.data,
      usage_events: usage.data,
      ad_views: views.data,
    };
    return new NextResponse(JSON.stringify(body, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="adhunter-mes-donnees-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    await logError("export:account", error, account.user.id);
    return NextResponse.json({ error: "L'export a échoué." }, { status: 500 });
  }
}
