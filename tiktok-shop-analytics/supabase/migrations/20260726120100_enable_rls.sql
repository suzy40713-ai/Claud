-- Row Level Security : chaque utilisateur ne voit et ne modifie que les
-- données rattachées à ses propres boutiques.

alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.returns enable row level security;
alter table public.ad_spend enable row level security;
alter table public.platform_fees enable row level security;

-- ---------------------------------------------------------------------
-- stores : accès direct via user_id
-- ---------------------------------------------------------------------
create policy "stores_select_own" on public.stores
  for select using (user_id = auth.uid());

create policy "stores_insert_own" on public.stores
  for insert with check (user_id = auth.uid());

create policy "stores_update_own" on public.stores
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "stores_delete_own" on public.stores
  for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- products : accès via store_id -> stores.user_id
-- ---------------------------------------------------------------------
create policy "products_select_own" on public.products
  for select using (
    exists (
      select 1 from public.stores
      where stores.id = products.store_id and stores.user_id = auth.uid()
    )
  );

create policy "products_insert_own" on public.products
  for insert with check (
    exists (
      select 1 from public.stores
      where stores.id = products.store_id and stores.user_id = auth.uid()
    )
  );

create policy "products_update_own" on public.products
  for update using (
    exists (
      select 1 from public.stores
      where stores.id = products.store_id and stores.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.stores
      where stores.id = products.store_id and stores.user_id = auth.uid()
    )
  );

create policy "products_delete_own" on public.products
  for delete using (
    exists (
      select 1 from public.stores
      where stores.id = products.store_id and stores.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- orders : accès via store_id -> stores.user_id
-- ---------------------------------------------------------------------
create policy "orders_select_own" on public.orders
  for select using (
    exists (
      select 1 from public.stores
      where stores.id = orders.store_id and stores.user_id = auth.uid()
    )
  );

create policy "orders_insert_own" on public.orders
  for insert with check (
    exists (
      select 1 from public.stores
      where stores.id = orders.store_id and stores.user_id = auth.uid()
    )
  );

create policy "orders_update_own" on public.orders
  for update using (
    exists (
      select 1 from public.stores
      where stores.id = orders.store_id and stores.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.stores
      where stores.id = orders.store_id and stores.user_id = auth.uid()
    )
  );

create policy "orders_delete_own" on public.orders
  for delete using (
    exists (
      select 1 from public.stores
      where stores.id = orders.store_id and stores.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- returns : accès via order_id -> orders.store_id -> stores.user_id
-- ---------------------------------------------------------------------
create policy "returns_select_own" on public.returns
  for select using (
    exists (
      select 1 from public.orders
      join public.stores on stores.id = orders.store_id
      where orders.id = returns.order_id and stores.user_id = auth.uid()
    )
  );

create policy "returns_insert_own" on public.returns
  for insert with check (
    exists (
      select 1 from public.orders
      join public.stores on stores.id = orders.store_id
      where orders.id = returns.order_id and stores.user_id = auth.uid()
    )
  );

create policy "returns_update_own" on public.returns
  for update using (
    exists (
      select 1 from public.orders
      join public.stores on stores.id = orders.store_id
      where orders.id = returns.order_id and stores.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.orders
      join public.stores on stores.id = orders.store_id
      where orders.id = returns.order_id and stores.user_id = auth.uid()
    )
  );

create policy "returns_delete_own" on public.returns
  for delete using (
    exists (
      select 1 from public.orders
      join public.stores on stores.id = orders.store_id
      where orders.id = returns.order_id and stores.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- ad_spend : accès via store_id -> stores.user_id
-- ---------------------------------------------------------------------
create policy "ad_spend_select_own" on public.ad_spend
  for select using (
    exists (
      select 1 from public.stores
      where stores.id = ad_spend.store_id and stores.user_id = auth.uid()
    )
  );

create policy "ad_spend_insert_own" on public.ad_spend
  for insert with check (
    exists (
      select 1 from public.stores
      where stores.id = ad_spend.store_id and stores.user_id = auth.uid()
    )
  );

create policy "ad_spend_update_own" on public.ad_spend
  for update using (
    exists (
      select 1 from public.stores
      where stores.id = ad_spend.store_id and stores.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.stores
      where stores.id = ad_spend.store_id and stores.user_id = auth.uid()
    )
  );

create policy "ad_spend_delete_own" on public.ad_spend
  for delete using (
    exists (
      select 1 from public.stores
      where stores.id = ad_spend.store_id and stores.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- platform_fees : accès via store_id -> stores.user_id
-- ---------------------------------------------------------------------
create policy "platform_fees_select_own" on public.platform_fees
  for select using (
    exists (
      select 1 from public.stores
      where stores.id = platform_fees.store_id and stores.user_id = auth.uid()
    )
  );

create policy "platform_fees_insert_own" on public.platform_fees
  for insert with check (
    exists (
      select 1 from public.stores
      where stores.id = platform_fees.store_id and stores.user_id = auth.uid()
    )
  );

create policy "platform_fees_update_own" on public.platform_fees
  for update using (
    exists (
      select 1 from public.stores
      where stores.id = platform_fees.store_id and stores.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.stores
      where stores.id = platform_fees.store_id and stores.user_id = auth.uid()
    )
  );

create policy "platform_fees_delete_own" on public.platform_fees
  for delete using (
    exists (
      select 1 from public.stores
      where stores.id = platform_fees.store_id and stores.user_id = auth.uid()
    )
  );
