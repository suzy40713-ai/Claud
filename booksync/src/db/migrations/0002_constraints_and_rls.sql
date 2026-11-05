-- Anti double réservation : deux rendez-vous actifs d'un même employé ne peuvent pas se chevaucher.
-- La plage bloquée inclut le temps tampon après la prestation. Bornes semi-ouvertes : [début, fin).
ALTER TABLE "appointment"
  ADD CONSTRAINT "appointment_no_overlap"
  EXCLUDE USING gist (
    "staff_id" WITH =,
    tstzrange("starts_at", "blocked_until", '[)') WITH &&
  ) WHERE ("status" IN ('confirmed', 'completed', 'no_show'));
--> statement-breakpoint
-- Logo et visuel de couverture (références circulaires organisation ↔ fichier).
ALTER TABLE "organization"
  ADD CONSTRAINT "organization_logo_file_fk" FOREIGN KEY ("logo_file_id") REFERENCES "file"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "organization_cover_file_fk" FOREIGN KEY ("cover_file_id") REFERENCES "file"("id") ON DELETE SET NULL;
--> statement-breakpoint
-- RLS sans politique sur toutes les tables : l'API REST publique de Supabase (anon / authenticated)
-- n'a accès à rien. L'application accède aux données uniquement côté serveur.
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
--> statement-breakpoint
-- Révocation explicite des droits des rôles de l'API Supabase (s'ils existent).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
  END IF;
END $$;
