/**
 * Schéma de la base BookSync.
 *
 * Règles :
 * - chaque table métier porte un `organization_id` (multi-tenant) ;
 * - la RLS est activée sur toutes les tables du schéma `public` (protection de l'API Supabase).
 */
export * from "./auth";
export * from "./email";
export * from "./business";
