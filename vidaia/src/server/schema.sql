-- VidaIA : tables préfixées vid_ (même base que BookSync, données séparées). RLS activée partout.
CREATE TABLE IF NOT EXISTS vid_account (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  credits integer NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vid_account ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS vid_purchase (
  stripe_session_id text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES vid_account(id) ON DELETE CASCADE,
  pack text NOT NULL,
  videos integer NOT NULL,
  amount_cents integer NOT NULL,
  waiver_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vid_purchase ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS vid_video (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES vid_account(id) ON DELETE CASCADE,
  request jsonb NOT NULL,
  script jsonb NOT NULL,
  starts jsonb NOT NULL,
  voice_end real NOT NULL,
  audio_base64 text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vid_video_account_idx ON vid_video (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vid_video_created_idx ON vid_video (created_at);
ALTER TABLE vid_video ENABLE ROW LEVEL SECURITY;
