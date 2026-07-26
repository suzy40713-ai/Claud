-- Étape 2 : schéma coeur — boutiques, produits, commandes, retours,
-- dépenses publicitaires et frais de plateforme.
--
-- `auth.users` est géré par Supabase Auth ; toutes les tables métier
-- remontent à un `store`, lui-même rattaché à un `user_id`.

create extension if not exists "pgcrypto";

-- Fonction utilitaire pour maintenir `updated_at` à jour.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- stores
-- ---------------------------------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  platform text not null default 'tiktok_shop',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stores_user_id_idx on public.stores (user_id);

create trigger stores_set_updated_at
  before update on public.stores
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  sku text not null,
  sale_price numeric(12, 2) not null check (sale_price >= 0),
  cost_price numeric(12, 2) not null check (cost_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, sku)
);

create index products_store_id_idx on public.products (store_id);

create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  external_order_id text,
  quantity integer not null default 1 check (quantity > 0),
  unit_sale_price numeric(12, 2) not null check (unit_sale_price >= 0),
  order_date date not null,
  status text not null default 'completed'
    check (status in ('pending', 'completed', 'cancelled', 'refunded')),
  created_at timestamptz not null default now()
);

create index orders_store_id_idx on public.orders (store_id);
create index orders_product_id_idx on public.orders (product_id);
create index orders_order_date_idx on public.orders (order_date);

-- ---------------------------------------------------------------------
-- returns
-- ---------------------------------------------------------------------
create table public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  return_date date not null,
  reason text,
  refunded_amount numeric(12, 2) not null check (refunded_amount >= 0),
  created_at timestamptz not null default now()
);

create index returns_order_id_idx on public.returns (order_id);
create index returns_return_date_idx on public.returns (return_date);

-- ---------------------------------------------------------------------
-- ad_spend
-- ---------------------------------------------------------------------
create table public.ad_spend (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  campaign_name text not null,
  platform text not null default 'tiktok_ads',
  amount numeric(12, 2) not null check (amount >= 0),
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create index ad_spend_store_id_idx on public.ad_spend (store_id);
create index ad_spend_product_id_idx on public.ad_spend (product_id);
create index ad_spend_period_idx on public.ad_spend (period_start, period_end);

-- ---------------------------------------------------------------------
-- platform_fees
-- ---------------------------------------------------------------------
create table public.platform_fees (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  order_id uuid references public.orders (id) on delete cascade,
  fee_type text not null
    check (fee_type in ('commission', 'transaction_fee', 'shipping_fee', 'other')),
  amount numeric(12, 2) not null check (amount >= 0),
  period_start date,
  period_end date,
  created_at timestamptz not null default now(),
  check (order_id is not null or (period_start is not null and period_end is not null))
);

create index platform_fees_store_id_idx on public.platform_fees (store_id);
create index platform_fees_order_id_idx on public.platform_fees (order_id);
create index platform_fees_period_idx on public.platform_fees (period_start, period_end);
