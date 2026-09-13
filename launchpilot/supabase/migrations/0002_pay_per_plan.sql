-- LaunchPilot: pivot to pay-per-generation pricing (14,99€ per plan, no free tier).
-- Purely additive — safe to run on a database that already has 0001_init.sql applied.
-- Run this in the Supabase SQL editor after 0001_init.sql.

-- ============================================================================
-- usage_credits — repurposed as a simple non-expiring credit balance.
-- The old monthly columns (period_start, plans_generated_this_period) are
-- left in place but unused by the app from this point on.
-- ============================================================================
alter table public.usage_credits
  add column if not exists credits_balance integer not null default 0;

-- ============================================================================
-- credit_purchases — audit log of each 14,99€ purchase (Stripe or dev-mode).
-- ============================================================================
create table if not exists public.credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_session_id text unique,
  credits_granted integer not null default 1,
  amount_cents integer not null default 1499,
  created_at timestamptz not null default now()
);

alter table public.credit_purchases enable row level security;

create policy "Users view their own purchases"
  on public.credit_purchases for select using (auth.uid() = user_id);

-- Writes happen exclusively through the service-role client (Stripe webhook
-- or the dev-mode purchase action), same pattern as usage_credits.

create index if not exists credit_purchases_user_id_idx on public.credit_purchases(user_id);
