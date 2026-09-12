-- LaunchPilot initial schema
-- Run this in the Supabase SQL editor, or via `supabase db push`.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto";

-- ============================================================================
-- Helper: auto-update `updated_at`
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- profiles — 1:1 with auth.users
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  theme_preference text not null default 'system' check (theme_preference in ('system', 'light', 'dark')),
  stripe_customer_id text unique,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile + usage_credits row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');

  insert into public.usage_credits (user_id, period_start, plans_generated_this_period)
  values (new.id, date_trunc('month', now()), 0);

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- products — one product being launched per row
-- ============================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Step 1: product
  name text not null,
  description text not null,
  category text not null,
  url text,

  -- Step 2: target customer
  target_customer text,
  target_age text,
  target_market text,
  main_problem text,

  -- Step 3: business
  price numeric,
  business_model text,
  sales_platform text,
  margin numeric,
  monthly_goal text,

  -- Step 4: resources
  marketing_budget text,
  weekly_time_hours numeric,
  social_networks text[] not null default '{}',
  existing_audience text,

  -- Step 5: objective
  objective text check (
    objective in (
      'first_customers', 'increase_sales', 'launch_product',
      'grow_audience', 'find_positioning'
    )
  ),

  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Users manage their own products"
  on public.products for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index if not exists products_user_id_idx on public.products(user_id);

-- ============================================================================
-- marketing_reports — one AI generation run per row
-- ============================================================================
create table if not exists public.marketing_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  score int not null check (score between 0 and 100),
  positioning_score int not null check (positioning_score between 0 and 100),
  offer_score int not null check (offer_score between 0 and 100),
  acquisition_score int not null check (acquisition_score between 0 and 100),
  content_score int not null check (content_score between 0 and 100),
  conversion_score int not null check (conversion_score between 0 and 100),
  social_proof_score int not null check (social_proof_score between 0 and 100),

  -- Array of { axis, score, problem, recommendation, priority } for UI rendering.
  subscore_details jsonb not null default '[]',
  summary text,

  status text not null default 'completed' check (status in ('pending', 'completed', 'failed')),
  raw_ai_response jsonb,

  created_at timestamptz not null default now()
);

alter table public.marketing_reports enable row level security;

create policy "Users manage their own reports"
  on public.marketing_reports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists marketing_reports_user_id_idx on public.marketing_reports(user_id);
create index if not exists marketing_reports_product_id_idx on public.marketing_reports(product_id);

-- ============================================================================
-- personas
-- ============================================================================
create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.marketing_reports(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  profile_summary text not null,
  main_problem text not null,
  goals text[] not null default '{}',
  frustrations text[] not null default '{}',
  motivations text[] not null default '{}',
  objections text[] not null default '{}',
  where_to_find text[] not null default '{}',
  content_consumed text[] not null default '{}',
  is_hypothesis boolean not null default true,

  created_at timestamptz not null default now()
);

alter table public.personas enable row level security;
create policy "Users manage their own personas"
  on public.personas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists personas_report_id_idx on public.personas(report_id);

-- ============================================================================
-- positioning
-- ============================================================================
create table if not exists public.positioning (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.marketing_reports(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  value_proposition text not null,
  problem text not null,
  solution text not null,
  differentiation text not null,
  main_benefit text not null,
  elevator_pitch text not null,
  selling_points text[] not null default '{}',

  created_at timestamptz not null default now()
);

alter table public.positioning enable row level security;
create policy "Users manage their own positioning"
  on public.positioning for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists positioning_report_id_idx on public.positioning(report_id);

-- ============================================================================
-- offers
-- ============================================================================
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.marketing_reports(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  main_offer text not null,
  bonuses text[] not null default '{}',
  guarantee text,
  urgency text,
  cta text not null,
  objections jsonb not null default '[]', -- [{objection, response}]

  created_at timestamptz not null default now()
);

alter table public.offers enable row level security;
create policy "Users manage their own offers"
  on public.offers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists offers_report_id_idx on public.offers(report_id);

-- ============================================================================
-- acquisition_strategies
-- ============================================================================
create table if not exists public.acquisition_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.marketing_reports(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  budget_tier text not null check (budget_tier in ('free', 'small_budget')),
  channel text not null,
  description text not null,
  difficulty text not null check (difficulty in ('facile', 'moyen', 'difficile')),
  cost text not null,
  time_required text not null,
  potential text not null check (potential in ('faible', 'moyen', 'eleve')),
  first_action text not null,

  created_at timestamptz not null default now()
);

alter table public.acquisition_strategies enable row level security;
create policy "Users manage their own acquisition strategies"
  on public.acquisition_strategies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists acquisition_strategies_report_id_idx on public.acquisition_strategies(report_id);

-- ============================================================================
-- content_ideas
-- ============================================================================
create table if not exists public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.marketing_reports(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  idx int not null,
  platform text not null,
  format text not null,
  hook text not null,
  subject text not null,
  script text not null,
  cta text not null,
  objective text not null,

  created_at timestamptz not null default now()
);

alter table public.content_ideas enable row level security;
create policy "Users manage their own content ideas"
  on public.content_ideas for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists content_ideas_report_id_idx on public.content_ideas(report_id);

-- ============================================================================
-- action_plans — the 30-day calendar
-- ============================================================================
create table if not exists public.action_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.marketing_reports(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  day_number int not null check (day_number between 1 and 30),
  objective text not null,
  task text not null,
  duration_minutes int not null,
  platform text not null,
  expected_result text not null,

  created_at timestamptz not null default now(),
  unique (report_id, day_number)
);

alter table public.action_plans enable row level security;
create policy "Users manage their own action plans"
  on public.action_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists action_plans_report_id_idx on public.action_plans(report_id);

-- ============================================================================
-- action_progress — completion tracking for action_plans
-- ============================================================================
create table if not exists public.action_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_plan_id uuid not null references public.action_plans(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,

  unique (user_id, action_plan_id)
);

alter table public.action_progress enable row level security;
create policy "Users manage their own action progress"
  on public.action_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- first_customer_actions
-- ============================================================================
create table if not exists public.first_customer_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.marketing_reports(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  timeframe text not null check (timeframe in ('today', 'week', 'month')),
  action text not null,
  sort_order int not null default 0,

  created_at timestamptz not null default now()
);

alter table public.first_customer_actions enable row level security;
create policy "Users manage their own first-customer actions"
  on public.first_customer_actions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists first_customer_actions_report_id_idx on public.first_customer_actions(report_id);

-- ============================================================================
-- emails
-- ============================================================================
create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.marketing_reports(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  email_type text not null check (email_type in ('launch', 'intro', 'follow_up', 'recovery', 'loyalty')),
  subject text not null,
  body text not null,

  created_at timestamptz not null default now()
);

alter table public.emails enable row level security;
create policy "Users manage their own emails"
  on public.emails for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists emails_report_id_idx on public.emails(report_id);

-- ============================================================================
-- ads
-- ============================================================================
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_id uuid not null references public.marketing_reports(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  platform text not null,
  angle text not null,
  hook text not null,
  primary_text text not null,
  headline text not null,
  cta text not null,
  target_audience text not null,

  created_at timestamptz not null default now()
);

alter table public.ads enable row level security;
create policy "Users manage their own ads"
  on public.ads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists ads_report_id_idx on public.ads(report_id);

-- ============================================================================
-- product_page_analyses — best-effort audit of a public product URL
-- ============================================================================
create table if not exists public.product_page_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,

  url text not null,
  page_title text,
  meta_description text,
  fetch_status text not null default 'ok' check (fetch_status in ('ok', 'blocked', 'error')),
  findings jsonb not null default '{}',
  improvements jsonb not null default '[]',

  created_at timestamptz not null default now()
);

alter table public.product_page_analyses enable row level security;
create policy "Users manage their own product page analyses"
  on public.product_page_analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- subscriptions — mirrors Stripe subscription state
-- ============================================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  plan text not null default 'free' check (plan in ('free', 'pro')),
  status text not null default 'active' check (
    status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid')
  ),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
create policy "Users view their own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);

-- Only the service role (Stripe webhook) may write subscriptions directly;
-- no insert/update/delete policy is granted to regular users.

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- usage_credits — server-enforced generation limits per billing period
-- ============================================================================
create table if not exists public.usage_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,

  period_start date not null default date_trunc('month', now()),
  plans_generated_this_period int not null default 0,

  updated_at timestamptz not null default now()
);

alter table public.usage_credits enable row level security;
create policy "Users view their own usage"
  on public.usage_credits for select using (auth.uid() = user_id);

-- Writes happen exclusively through the service-role client in
-- src/lib/credits.ts, inside the server action that performs generation —
-- this is what stops a user from bypassing limits by refreshing the page.

create trigger usage_credits_set_updated_at
  before update on public.usage_credits
  for each row execute function public.set_updated_at();
