-- TrendRadar database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- One row per auth.users, holds plan + credit balances.
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'creator', 'pro')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_subscription_status text,
  search_credits integer not null default 5,
  idea_credits_per_search integer not null default 10,
  credits_reset_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ============================================================
-- CREDIT TRANSACTIONS
-- Ledger of every credit debit/credit so limits can be audited
-- and changed later without touching business logic.
-- ============================================================
create table if not exists public.credit_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;

create policy "Users can view own credit transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- ============================================================
-- SEARCHES
-- One row per "find ideas" request.
-- ============================================================
create table if not exists public.searches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  niche text not null,
  platform text not null check (platform in ('tiktok', 'instagram', 'youtube_shorts')),
  style text not null,
  idea_count integer not null default 10,
  created_at timestamptz not null default now()
);

alter table public.searches enable row level security;

create policy "Users can view own searches"
  on public.searches for select
  using (auth.uid() = user_id);

create policy "Users can insert own searches"
  on public.searches for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- IDEAS
-- Generated ideas belonging to a search.
-- ============================================================
create table if not exists public.ideas (
  id uuid primary key default uuid_generate_v4(),
  search_id uuid references public.searches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null default 'tiktok' check (platform in ('tiktok', 'instagram', 'youtube_shorts')),
  title text not null,
  hook text not null,
  concept text not null,
  format text,
  recommended_duration text,
  audience text,
  cta text,
  hashtags text[] default '{}',
  opportunity_score integer not null default 0,
  score_breakdown jsonb default '{}'::jsonb,
  is_saved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.ideas enable row level security;

create policy "Users can view own ideas"
  on public.ideas for select
  using (auth.uid() = user_id);

create policy "Users can insert own ideas"
  on public.ideas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ideas"
  on public.ideas for update
  using (auth.uid() = user_id);

create policy "Users can delete own ideas"
  on public.ideas for delete
  using (auth.uid() = user_id);

-- ============================================================
-- SCRIPTS
-- Generated scripts for an idea.
-- ============================================================
create table if not exists public.scripts (
  id uuid primary key default uuid_generate_v4(),
  idea_id uuid references public.ideas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hook text,
  introduction text,
  development text,
  conclusion text,
  cta text,
  estimated_duration text,
  narration_notes text,
  on_screen_text text,
  visual_ideas text,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.scripts enable row level security;

create policy "Users can view own scripts"
  on public.scripts for select
  using (auth.uid() = user_id);

create policy "Users can insert own scripts"
  on public.scripts for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- IDEA ANALYSES
-- Free-form idea text submitted by a user + AI critique.
-- ============================================================
create table if not exists public.idea_analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_idea text not null,
  overall_score integer,
  curiosity_score integer,
  clarity_score integer,
  originality_score integer,
  retention_score integer,
  share_score integer,
  strengths text[],
  improvements text[],
  improved_versions jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.idea_analyses enable row level security;

create policy "Users can view own analyses"
  on public.idea_analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.idea_analyses for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- CONTENT CALENDAR
-- Schedules saved ideas/scripts on specific dates.
-- ============================================================
create table if not exists public.calendar_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid references public.ideas(id) on delete set null,
  title text not null,
  scheduled_date date not null,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'published')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.calendar_entries enable row level security;

create policy "Users can manage own calendar entries"
  on public.calendar_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- RADAR SIGNALS
-- Placeholder trend data. Architecture is ready to be filled by
-- a scheduled job pulling Google Trends / social APIs later; for
-- now rows can be seeded by AI or an admin script.
-- ============================================================
create table if not exists public.radar_signals (
  id uuid primary key default uuid_generate_v4(),
  niche text not null,
  platform text not null check (platform in ('tiktok', 'instagram', 'youtube_shorts', 'all')),
  category text not null check (category in ('trending', 'rising', 'watch', 'opportunity')),
  title text not null,
  description text,
  source text not null default 'ai_estimate' check (source in ('ai_estimate', 'google_trends', 'social_api', 'manual')),
  confidence integer default 50,
  created_at timestamptz not null default now()
);

alter table public.radar_signals enable row level security;

create policy "Anyone authenticated can read radar signals"
  on public.radar_signals for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- Trigger: auto-create a profile row when a new auth user signs up.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create index if not exists idx_ideas_user_id on public.ideas(user_id);
create index if not exists idx_ideas_search_id on public.ideas(search_id);
create index if not exists idx_searches_user_id on public.searches(user_id);
create index if not exists idx_calendar_user_id on public.calendar_entries(user_id);
create index if not exists idx_radar_niche on public.radar_signals(niche);
