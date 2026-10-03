-- ============================================================================
-- AdHunter — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`).
--
-- Security model
--  * Every user-owned table has RLS enabled; users only read/write their rows.
--  * Billing state (subscriptions), usage counters, ads and plan limits are
--    written exclusively by the server with the service-role key (no RLS
--    write policy for `authenticated`), so a user cannot grant themselves a
--    plan or reset their quotas from the browser.
--  * `profiles.role` cannot be changed by users (column-level grants).
-- ============================================================================

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- profiles
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  tutorial_completed boolean not null default false,
  marketing_opt_in boolean not null default false,
  terms_accepted_at timestamptz,
  preferred_niches text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Users may only update harmless columns; `role` and `email` stay server-managed.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, tutorial_completed, marketing_opt_in, preferred_niches)
  on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, terms_accepted_at, marketing_opt_in)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    case when (new.raw_user_meta_data->>'terms_accepted') = 'true' then now() else null end,
    coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ============================================================================
-- plans — editable from the admin area; read by everyone (pricing page)
-- ============================================================================
create table public.plans (
  id text primary key check (id in ('free', 'pro', 'business')),
  name text not null,
  price_cents integer not null default 0,
  currency text not null default 'eur',
  stripe_price_id text,
  limits jsonb not null default '{}'::jsonb,
  features text[] not null default '{}',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

alter table public.plans enable row level security;
create policy "plans: public read" on public.plans for select using (true);

insert into public.plans (id, name, price_cents, limits, features, sort_order) values
  ('free', 'Free', 0,
   '{"searches_per_month": 20, "ai_analyses_per_month": 5, "ai_creations_per_month": 0, "collections_max": 1, "results_per_search": 12, "exports_per_month": 0}',
   '{}', 0),
  ('pro', 'Pro', 1999,
   '{"searches_per_month": 500, "ai_analyses_per_month": 100, "ai_creations_per_month": 100, "collections_max": -1, "results_per_search": 24, "exports_per_month": 0}',
   '{ad_creator,search_history,trend_radar}', 1),
  ('business', 'Business', 4999,
   '{"searches_per_month": 3000, "ai_analyses_per_month": 500, "ai_creations_per_month": 500, "collections_max": -1, "results_per_search": 50, "exports_per_month": 200}',
   '{ad_creator,search_history,trend_radar,teams,exports,advanced_search}', 2);

-- ============================================================================
-- feature_flags — global kill-switches managed by admins
-- ============================================================================
create table public.feature_flags (
  key text primary key,
  enabled boolean not null default true,
  description text,
  updated_at timestamptz not null default now()
);

create trigger feature_flags_updated_at before update on public.feature_flags
  for each row execute function public.set_updated_at();

alter table public.feature_flags enable row level security;
create policy "feature_flags: authenticated read" on public.feature_flags
  for select to authenticated using (true);

insert into public.feature_flags (key, enabled, description) values
  ('source_meta', true, 'Recherche via Meta Ad Library API'),
  ('source_tiktok', true, 'Recherche via TikTok Commercial Content API'),
  ('ai_analyzer', true, 'Analyse IA des publicités'),
  ('ai_creator', true, 'Générateur de publicités IA'),
  ('trend_radar', true, 'Radar de tendances'),
  ('signups', true, 'Ouverture des inscriptions');

-- ============================================================================
-- subscriptions — written only by the Stripe webhook / admin (service role)
-- ============================================================================
create table public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  status text not null default 'inactive'
    check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused', 'inactive')),
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  source text not null default 'stripe' check (source in ('stripe', 'manual')),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;
create policy "subscriptions: read own" on public.subscriptions
  for select using (auth.uid() = user_id);

create table public.stripe_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;

-- ============================================================================
-- usage_events — metered actions (searches, AI analyses, creations, exports)
-- ============================================================================
create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('search', 'analysis', 'creation', 'export')),
  created_at timestamptz not null default now()
);
create index usage_events_user_kind_idx on public.usage_events (user_id, kind, created_at desc);

alter table public.usage_events enable row level security;
create policy "usage_events: read own" on public.usage_events
  for select using (auth.uid() = user_id);

-- Atomically checks a quota and records the event. `p_limit < 0` = unlimited.
-- Callable by the service role only.
create or replace function public.consume_quota(p_user uuid, p_kind text, p_limit integer, p_since timestamptz)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  used integer;
begin
  if p_limit = 0 then
    return false;
  end if;
  perform pg_advisory_xact_lock(hashtext(p_user::text || ':' || p_kind));
  if p_limit > 0 then
    select count(*) into used from public.usage_events
      where user_id = p_user and kind = p_kind and created_at >= p_since;
    if used >= p_limit then
      return false;
    end if;
  end if;
  insert into public.usage_events (user_id, kind) values (p_user, p_kind);
  return true;
end;
$$;

-- Gives back a quota unit when the metered action failed (e.g. upstream API down).
create or replace function public.refund_quota(p_user uuid, p_kind text)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.usage_events where id = (
    select id from public.usage_events
    where user_id = p_user and kind = p_kind
    order by created_at desc limit 1
  );
end;
$$;

revoke execute on function public.consume_quota(uuid, text, integer, timestamptz) from public, anon, authenticated;
revoke execute on function public.refund_quota(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_quota(uuid, text, integer, timestamptz) to service_role;
grant execute on function public.refund_quota(uuid, text) to service_role;

-- ============================================================================
-- ads — normalized public ad records from official libraries (shared cache)
-- ============================================================================
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('meta', 'tiktok', 'demo')),
  source_ad_id text not null,
  advertiser text,
  advertiser_id text,
  body text,
  title text,
  description text,
  cta text,
  media_type text not null default 'unknown' check (media_type in ('image', 'video', 'carousel', 'text', 'unknown')),
  media_urls text[] not null default '{}',
  thumbnail_url text,
  platforms text[] not null default '{}',
  countries text[] not null default '{}',
  languages text[] not null default '{}',
  start_date date,
  end_date date,
  is_active boolean,
  source_url text,
  niche text,
  is_demo boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source, source_ad_id)
);
create index ads_niche_idx on public.ads (niche);
create index ads_last_seen_idx on public.ads (last_seen_at desc);

alter table public.ads enable row level security;
create policy "ads: authenticated read" on public.ads
  for select to authenticated using (true);

create table public.search_cache (
  cache_key text primary key,
  ad_ids uuid[] not null default '{}',
  next_cursor text,
  created_at timestamptz not null default now()
);
alter table public.search_cache enable row level security;

-- ============================================================================
-- searches / ad_views — personal history
-- ============================================================================
create table public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text,
  niche text,
  filters jsonb not null default '{}'::jsonb,
  sources text[] not null default '{}',
  results_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index searches_user_idx on public.searches (user_id, created_at desc);
create index searches_created_idx on public.searches (created_at desc);

alter table public.searches enable row level security;
create policy "searches: read own" on public.searches for select using (auth.uid() = user_id);
create policy "searches: delete own" on public.searches for delete using (auth.uid() = user_id);

create table public.ad_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  ad_id uuid not null references public.ads(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, ad_id)
);
alter table public.ad_views enable row level security;
create policy "ad_views: own" on public.ad_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- teams (Business plan)
-- ============================================================================
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (team_id, email)
);

create or replace function public.is_team_member(p_team uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_members where team_id = p_team and user_id = auth.uid());
$$;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;

create policy "teams: members read" on public.teams for select using (public.is_team_member(id) or owner_id = auth.uid());
create policy "team_members: members read" on public.team_members for select using (public.is_team_member(team_id));
create policy "team_invitations: owner read" on public.team_invitations for select
  using (exists (select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()));
-- Team writes go through server actions (service role) after plan checks.

-- ============================================================================
-- saved_ads (favorites), collections, collection_items
-- ============================================================================
create table public.saved_ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ad_id uuid not null references public.ads(id) on delete cascade,
  note text,
  niche text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ad_id)
);
create trigger saved_ads_updated_at before update on public.saved_ads
  for each row execute function public.set_updated_at();

alter table public.saved_ads enable row level security;
create policy "saved_ads: own" on public.saved_ads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  description text,
  niche text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

create or replace function public.can_access_collection(p_collection uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.collections c
    where c.id = p_collection
      and (c.user_id = auth.uid() or (c.team_id is not null and public.is_team_member(c.team_id)))
  );
$$;

alter table public.collections enable row level security;
create policy "collections: read own or team" on public.collections
  for select using (user_id = auth.uid() or (team_id is not null and public.is_team_member(team_id)));
create policy "collections: update own" on public.collections
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "collections: delete own" on public.collections
  for delete using (user_id = auth.uid());
-- Inserts go through a server action that enforces the plan's collection limit.

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  ad_id uuid not null references public.ads(id) on delete cascade,
  added_by uuid not null references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (collection_id, ad_id)
);

alter table public.collection_items enable row level security;
create policy "collection_items: read accessible" on public.collection_items
  for select using (public.can_access_collection(collection_id));
create policy "collection_items: insert accessible" on public.collection_items
  for insert with check (added_by = auth.uid() and public.can_access_collection(collection_id));
create policy "collection_items: update accessible" on public.collection_items
  for update using (public.can_access_collection(collection_id));
create policy "collection_items: delete accessible" on public.collection_items
  for delete using (public.can_access_collection(collection_id));

-- ============================================================================
-- AI results
-- ============================================================================
create table public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ad_id uuid not null references public.ads(id) on delete cascade,
  result jsonb not null,
  model text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index ai_analyses_user_idx on public.ai_analyses (user_id, created_at desc);

alter table public.ai_analyses enable row level security;
create policy "ai_analyses: read own" on public.ai_analyses for select using (auth.uid() = user_id);
create policy "ai_analyses: delete own" on public.ai_analyses for delete using (auth.uid() = user_id);

create table public.ai_creations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  input jsonb not null,
  result jsonb not null,
  model text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger ai_creations_updated_at before update on public.ai_creations
  for each row execute function public.set_updated_at();
create index ai_creations_user_idx on public.ai_creations (user_id, created_at desc);

alter table public.ai_creations enable row level security;
create policy "ai_creations: read own" on public.ai_creations for select using (auth.uid() = user_id);
create policy "ai_creations: update own" on public.ai_creations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ai_creations: delete own" on public.ai_creations for delete using (auth.uid() = user_id);

-- ============================================================================
-- Ops: error log + contact messages (service role only)
-- ============================================================================
create table public.app_errors (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  context text not null,
  message text not null,
  details jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index app_errors_created_idx on public.app_errors (created_at desc);
alter table public.app_errors enable row level security;

create table public.contact_messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
