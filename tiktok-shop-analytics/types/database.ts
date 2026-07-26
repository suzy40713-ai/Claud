/**
 * Placeholder for the generated Supabase database types.
 * Once the migrations in supabase/migrations are applied, regenerate this
 * file with:
 *   npx supabase gen types typescript --project-id <project-id> > types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
