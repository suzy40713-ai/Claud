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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "returns_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "ad_spend_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ad_spend_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "platform_fees_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "platform_fees_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
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
