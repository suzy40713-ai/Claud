/**
 * Hand-written mirror of supabase/migrations/0001_init.sql.
 * With the Supabase CLI and a linked project you can regenerate it with
 * `supabase gen types typescript --linked > src/types/database.ts`
 * (then re-add the helper types at the bottom).
 */

export type PlanId = "free" | "pro" | "business";
export type AdSource = "meta" | "tiktok" | "demo";
export type MediaType = "image" | "video" | "carousel" | "text" | "unknown";
export type UsageKind = "search" | "analysis" | "creation" | "export";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused"
  | "inactive";

export interface PlanLimits {
  searches_per_month: number;
  ai_analyses_per_month: number;
  ai_creations_per_month: number;
  collections_max: number;
  results_per_search: number;
  exports_per_month: number;
}

type Table<Row, Required extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          email: string;
          full_name: string | null;
          role: "user" | "admin";
          tutorial_completed: boolean;
          marketing_opt_in: boolean;
          terms_accepted_at: string | null;
          preferred_niches: string[];
          created_at: string;
          updated_at: string;
        },
        "id" | "email"
      >;
      plans: Table<
        {
          id: PlanId;
          name: string;
          price_cents: number;
          currency: string;
          stripe_price_id: string | null;
          limits: PlanLimits;
          features: string[];
          is_active: boolean;
          sort_order: number;
          updated_at: string;
        },
        "id" | "name"
      >;
      feature_flags: Table<
        { key: string; enabled: boolean; description: string | null; updated_at: string },
        "key"
      >;
      subscriptions: Table<
        {
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: PlanId;
          status: SubscriptionStatus;
          price_id: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          source: "stripe" | "manual";
          updated_at: string;
        },
        "user_id"
      >;
      stripe_events: Table<{ id: string; type: string; created_at: string }, "id" | "type">;
      usage_events: Table<
        { id: number; user_id: string; kind: UsageKind; created_at: string },
        "user_id" | "kind"
      >;
      ads: Table<
        {
          id: string;
          source: AdSource;
          source_ad_id: string;
          advertiser: string | null;
          advertiser_id: string | null;
          body: string | null;
          title: string | null;
          description: string | null;
          cta: string | null;
          media_type: MediaType;
          media_urls: string[];
          thumbnail_url: string | null;
          platforms: string[];
          countries: string[];
          languages: string[];
          start_date: string | null;
          end_date: string | null;
          is_active: boolean | null;
          source_url: string | null;
          niche: string | null;
          is_demo: boolean;
          first_seen_at: string;
          last_seen_at: string;
        },
        "source" | "source_ad_id"
      >;
      search_cache: Table<
        { cache_key: string; ad_ids: string[]; next_cursor: string | null; created_at: string },
        "cache_key"
      >;
      searches: Table<
        {
          id: string;
          user_id: string;
          query: string | null;
          niche: string | null;
          filters: Record<string, unknown>;
          sources: string[];
          results_count: number;
          created_at: string;
        },
        "user_id"
      >;
      ad_views: Table<{ user_id: string; ad_id: string; viewed_at: string }, "user_id" | "ad_id">;
      teams: Table<{ id: string; name: string; owner_id: string; created_at: string }, "name" | "owner_id">;
      team_members: Table<
        { team_id: string; user_id: string; role: "owner" | "member"; created_at: string },
        "team_id" | "user_id"
      >;
      team_invitations: Table<
        {
          id: string;
          team_id: string;
          email: string;
          invited_by: string;
          accepted_at: string | null;
          created_at: string;
        },
        "team_id" | "email" | "invited_by"
      >;
      saved_ads: Table<
        {
          id: string;
          user_id: string;
          ad_id: string;
          note: string | null;
          niche: string | null;
          created_at: string;
          updated_at: string;
        },
        "user_id" | "ad_id"
      >;
      collections: Table<
        {
          id: string;
          user_id: string;
          team_id: string | null;
          name: string;
          description: string | null;
          niche: string | null;
          created_at: string;
          updated_at: string;
        },
        "user_id" | "name"
      >;
      collection_items: Table<
        {
          id: string;
          collection_id: string;
          ad_id: string;
          added_by: string;
          note: string | null;
          created_at: string;
        },
        "collection_id" | "ad_id" | "added_by"
      >;
      ai_analyses: Table<
        {
          id: string;
          user_id: string;
          ad_id: string;
          result: unknown;
          model: string | null;
          is_demo: boolean;
          created_at: string;
        },
        "user_id" | "ad_id" | "result"
      >;
      ai_creations: Table<
        {
          id: string;
          user_id: string;
          title: string;
          input: unknown;
          result: unknown;
          model: string | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        },
        "user_id" | "title" | "input" | "result"
      >;
      app_errors: Table<
        {
          id: number;
          user_id: string | null;
          context: string;
          message: string;
          details: unknown;
          resolved: boolean;
          created_at: string;
        },
        "context" | "message"
      >;
      contact_messages: Table<
        {
          id: number;
          name: string;
          email: string;
          subject: string;
          message: string;
          user_id: string | null;
          created_at: string;
        },
        "name" | "email" | "subject" | "message"
      >;
    };
    Views: Record<string, never>;
    Functions: {
      consume_quota: {
        Args: { p_user: string; p_kind: UsageKind; p_limit: number; p_since: string };
        Returns: boolean;
      };
      refund_quota: { Args: { p_user: string; p_kind: UsageKind }; Returns: undefined };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Ad = Tables<"ads">;
