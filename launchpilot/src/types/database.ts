/**
 * Hand-written mirror of supabase/migrations/0001_init.sql.
 * If you have the Supabase CLI + a linked project, prefer regenerating this
 * with `supabase gen types typescript --linked > src/types/database.ts`
 * and re-apply the helper types exported below.
 */

export type PlanId = "free" | "pro";
export type Objective =
  | "first_customers"
  | "increase_sales"
  | "launch_product"
  | "grow_audience"
  | "find_positioning";
export type BudgetTier = "free" | "small_budget";
export type Timeframe = "today" | "week" | "month";
export type EmailType = "launch" | "intro" | "follow_up" | "recovery" | "loyalty";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "unpaid";

export interface SubscoreDetail {
  axis: "positioning" | "offer" | "acquisition" | "content" | "conversion" | "social_proof";
  label: string;
  score: number;
  problem: string;
  recommendation: string;
  priority: "haute" | "moyenne" | "basse";
}

export interface OfferObjection {
  objection: string;
  response: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          plan: PlanId;
          theme_preference: "system" | "light" | "dark";
          stripe_customer_id: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; email: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          category: string;
          url: string | null;
          target_customer: string | null;
          target_age: string | null;
          target_market: string | null;
          main_problem: string | null;
          price: number | null;
          business_model: string | null;
          sales_platform: string | null;
          margin: number | null;
          monthly_goal: string | null;
          marketing_budget: string | null;
          weekly_time_hours: number | null;
          social_networks: string[];
          existing_audience: string | null;
          objective: Objective | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          user_id: string;
          name: string;
          description: string;
          category: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [];
      };
      marketing_reports: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          score: number;
          positioning_score: number;
          offer_score: number;
          acquisition_score: number;
          content_score: number;
          conversion_score: number;
          social_proof_score: number;
          subscore_details: SubscoreDetail[];
          summary: string | null;
          status: "pending" | "completed" | "failed";
          raw_ai_response: unknown;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["marketing_reports"]["Row"]> & {
          user_id: string;
          product_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["marketing_reports"]["Row"]>;
        Relationships: [];
      };
      personas: {
        Row: {
          id: string;
          user_id: string;
          report_id: string;
          product_id: string;
          profile_summary: string;
          main_problem: string;
          goals: string[];
          frustrations: string[];
          motivations: string[];
          objections: string[];
          where_to_find: string[];
          content_consumed: string[];
          is_hypothesis: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["personas"]["Row"]> & {
          user_id: string;
          report_id: string;
          product_id: string;
          profile_summary: string;
          main_problem: string;
        };
        Update: Partial<Database["public"]["Tables"]["personas"]["Row"]>;
        Relationships: [];
      };
      positioning: {
        Row: {
          id: string;
          user_id: string;
          report_id: string;
          product_id: string;
          value_proposition: string;
          problem: string;
          solution: string;
          differentiation: string;
          main_benefit: string;
          elevator_pitch: string;
          selling_points: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["positioning"]["Row"]> & {
          user_id: string;
          report_id: string;
          product_id: string;
          value_proposition: string;
          problem: string;
          solution: string;
          differentiation: string;
          main_benefit: string;
          elevator_pitch: string;
        };
        Update: Partial<Database["public"]["Tables"]["positioning"]["Row"]>;
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          user_id: string;
          report_id: string;
          product_id: string;
          main_offer: string;
          bonuses: string[];
          guarantee: string | null;
          urgency: string | null;
          cta: string;
          objections: OfferObjection[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["offers"]["Row"]> & {
          user_id: string;
          report_id: string;
          product_id: string;
          main_offer: string;
          cta: string;
        };
        Update: Partial<Database["public"]["Tables"]["offers"]["Row"]>;
        Relationships: [];
      };
      acquisition_strategies: {
        Row: {
          id: string;
          user_id: string;
          report_id: string;
          product_id: string;
          budget_tier: BudgetTier;
          channel: string;
          description: string;
          difficulty: "facile" | "moyen" | "difficile";
          cost: string;
          time_required: string;
          potential: "faible" | "moyen" | "eleve";
          first_action: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["acquisition_strategies"]["Row"]> & {
          user_id: string;
          report_id: string;
          product_id: string;
          budget_tier: BudgetTier;
          channel: string;
          description: string;
          difficulty: "facile" | "moyen" | "difficile";
          cost: string;
          time_required: string;
          potential: "faible" | "moyen" | "eleve";
          first_action: string;
        };
        Update: Partial<Database["public"]["Tables"]["acquisition_strategies"]["Row"]>;
        Relationships: [];
      };
      content_ideas: {
        Row: {
          id: string;
          user_id: string;
          report_id: string;
          product_id: string;
          idx: number;
          platform: string;
          format: string;
          hook: string;
          subject: string;
          script: string;
          cta: string;
          objective: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["content_ideas"]["Row"]> & {
          user_id: string;
          report_id: string;
          product_id: string;
          idx: number;
          platform: string;
          format: string;
          hook: string;
          subject: string;
          script: string;
          cta: string;
          objective: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_ideas"]["Row"]>;
        Relationships: [];
      };
      action_plans: {
        Row: {
          id: string;
          user_id: string;
          report_id: string;
          product_id: string;
          day_number: number;
          objective: string;
          task: string;
          duration_minutes: number;
          platform: string;
          expected_result: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["action_plans"]["Row"]> & {
          user_id: string;
          report_id: string;
          product_id: string;
          day_number: number;
          objective: string;
          task: string;
          duration_minutes: number;
          platform: string;
          expected_result: string;
        };
        Update: Partial<Database["public"]["Tables"]["action_plans"]["Row"]>;
        Relationships: [];
      };
      action_progress: {
        Row: {
          id: string;
          user_id: string;
          action_plan_id: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["action_progress"]["Row"]> & {
          user_id: string;
          action_plan_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["action_progress"]["Row"]>;
        Relationships: [];
      };
      first_customer_actions: {
        Row: {
          id: string;
          user_id: string;
          report_id: string;
          product_id: string;
          timeframe: Timeframe;
          action: string;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["first_customer_actions"]["Row"]> & {
          user_id: string;
          report_id: string;
          product_id: string;
          timeframe: Timeframe;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["first_customer_actions"]["Row"]>;
        Relationships: [];
      };
      emails: {
        Row: {
          id: string;
          user_id: string;
          report_id: string;
          product_id: string;
          email_type: EmailType;
          subject: string;
          body: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["emails"]["Row"]> & {
          user_id: string;
          report_id: string;
          product_id: string;
          email_type: EmailType;
          subject: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["emails"]["Row"]>;
        Relationships: [];
      };
      ads: {
        Row: {
          id: string;
          user_id: string;
          report_id: string;
          product_id: string;
          platform: string;
          angle: string;
          hook: string;
          primary_text: string;
          headline: string;
          cta: string;
          target_audience: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ads"]["Row"]> & {
          user_id: string;
          report_id: string;
          product_id: string;
          platform: string;
          angle: string;
          hook: string;
          primary_text: string;
          headline: string;
          cta: string;
          target_audience: string;
        };
        Update: Partial<Database["public"]["Tables"]["ads"]["Row"]>;
        Relationships: [];
      };
      product_page_analyses: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          url: string;
          page_title: string | null;
          meta_description: string | null;
          fetch_status: "ok" | "blocked" | "error";
          findings: Record<string, unknown>;
          improvements: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_page_analyses"]["Row"]> & {
          user_id: string;
          product_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_page_analyses"]["Row"]>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: PlanId;
          status: SubscriptionStatus;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
        Relationships: [];
      };
      usage_credits: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          plans_generated_this_period: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["usage_credits"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["usage_credits"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
