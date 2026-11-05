/**
 * Schéma de la base BookSync.
 * Les tables sont ajoutées étape par étape (authentification, organisations, prestations…).
 *
 * Règles :
 * - chaque table métier porte un `organization_id` (multi-tenant) ;
 * - la RLS est activée sur toutes les tables du schéma `public` (protection de l'API Supabase).
 */
export {};
