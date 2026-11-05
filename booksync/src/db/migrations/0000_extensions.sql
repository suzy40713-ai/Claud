-- Extensions nécessaires à BookSync.
-- Supabase installe les extensions dans le schéma `extensions` ; on reproduit ce comportement en local.
CREATE SCHEMA IF NOT EXISTS extensions;
--> statement-breakpoint
-- btree_gist : contrainte d'exclusion anti-chevauchement des rendez-vous (EXCLUDE USING gist).
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;
--> statement-breakpoint
-- citext : emails insensibles à la casse.
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;
