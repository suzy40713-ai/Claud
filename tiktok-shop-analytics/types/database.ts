/**
 * Hand-written mirror of the Supabase schema in supabase/migrations.
 * Once the project is linked, regenerate (and diff) with:
 *   npx supabase gen types typescript --project-id <project-id> > types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus = "pending" | "completed" | "cancelled" | "refunded";
export type PlatformFeeType =
  | "commission"
  | "transaction_fee"
  | "shipping_fee"
  | "other";

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          platform: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          platform?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          platform?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          sku: string;
          sale_price: number;
          cost_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          sku: string;
          sale_price: number;
          cost_price: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          sku?: string;
          sale_price?: number;
          cost_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          store_id: string;
          product_id: string;
          external_order_id: string | null;
          quantity: number;
          unit_sale_price: number;
          order_date: string;
          status: OrderStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          product_id: string;
          external_order_id?: string | null;
          quantity?: number;
          unit_sale_price: number;
          order_date: string;
          status?: OrderStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          product_id?: string;
          external_order_id?: string | null;
          quantity?: number;
          unit_sale_price?: number;
          order_date?: string;
          status?: OrderStatus;
          created_at?: string;
        };
      };
      returns: {
        Row: {
          id: string;
          order_id: string;
          return_date: string;
          reason: string | null;
          refunded_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          return_date: string;
          reason?: string | null;
          refunded_amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          return_date?: string;
          reason?: string | null;
          refunded_amount?: number;
          created_at?: string;
        };
      };
      ad_spend: {
        Row: {
          id: string;
          store_id: string;
          product_id: string | null;
          campaign_name: string;
          platform: string;
          amount: number;
          period_start: string;
          period_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          product_id?: string | null;
          campaign_name: string;
          platform?: string;
          amount: number;
          period_start: string;
          period_end: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          product_id?: string | null;
          campaign_name?: string;
          platform?: string;
          amount?: number;
          period_start?: string;
          period_end?: string;
          created_at?: string;
        };
      };
      platform_fees: {
        Row: {
          id: string;
          store_id: string;
          order_id: string | null;
          fee_type: PlatformFeeType;
          amount: number;
          period_start: string | null;
          period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          order_id?: string | null;
          fee_type: PlatformFeeType;
          amount: number;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          order_id?: string | null;
          fee_type?: PlatformFeeType;
          amount?: number;
          period_start?: string | null;
          period_end?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
