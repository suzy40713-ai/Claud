-- Security tests for supabase/migrations/0001_init.sql.
-- Run against a disposable database after the migration (see README "Tests").
-- Every check raises an exception on failure; success prints "ALL RLS TESTS PASSED".
\set ON_ERROR_STOP 1
\set A '''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'''
\set B '''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'''

-- Fixtures (as superuser / service role) ------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  (:A, 'a@test.dev', '{"full_name":"Alice","terms_accepted":"true"}'),
  (:B, 'b@test.dev', '{"full_name":"Bob"}');
insert into public.ads (id, source, source_ad_id, advertiser) values
  ('00000000-0000-0000-0000-0000000000a1', 'demo', 'x1', 'Brand 1'),
  ('00000000-0000-0000-0000-0000000000a2', 'demo', 'x2', 'Brand 2');
insert into public.collections (id, user_id, name) values ('00000000-0000-0000-0000-0000000000c1', :B, 'Bob private');
insert into public.saved_ads (user_id, ad_id) values (:B, '00000000-0000-0000-0000-0000000000a1');
insert into public.app_errors (context, message) values ('test', 'boom');

do $$ begin
  if (select count(*) from public.profiles) <> 2 then raise exception 'profiles trigger failed'; end if;
  if (select terms_accepted_at is null from public.profiles where email = 'a@test.dev') then raise exception 'terms_accepted_at not set'; end if;
  if (select role from public.profiles where email = 'a@test.dev') <> 'user' then raise exception 'default role must be user'; end if;
end $$;

-- As Alice (authenticated) ----------------------------------------------------
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$ begin
  if (select count(*) from public.profiles) <> 1 then raise exception 'A sees other profiles'; end if;
  if (select count(*) from public.saved_ads) <> 0 then raise exception 'A sees B favorites'; end if;
  if (select count(*) from public.collections) <> 0 then raise exception 'A sees B private collection'; end if;
  if (select count(*) from public.ads) <> 2 then raise exception 'authenticated cannot read ads'; end if;
  if (select count(*) from public.app_errors) <> 0 then raise exception 'A can read app_errors'; end if;
  if (select count(*) from public.plans) <> 3 then raise exception 'plans not readable'; end if;
end $$;

-- allowed: update own harmless columns, save own favorite
update public.profiles set full_name = 'Alice B.' where id = auth.uid();
insert into public.saved_ads (user_id, ad_id) values (auth.uid(), '00000000-0000-0000-0000-0000000000a2');

do $$
declare ok boolean;
begin
  -- privilege escalation: role column is not updatable
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    raise exception 'A could change her role';
  exception when insufficient_privilege then null; end;

  -- billing state is server-only
  begin
    insert into public.subscriptions (user_id, plan, status) values (auth.uid(), 'business', 'active');
    raise exception 'A could grant herself a subscription';
  exception when insufficient_privilege then null; end;

  -- quotas are server-only
  begin
    perform public.consume_quota(auth.uid(), 'analysis', -1, now());
    raise exception 'A could call consume_quota';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.usage_events (user_id, kind) values (auth.uid(), 'search');
    raise exception 'A could write usage_events';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.usage_events where user_id = auth.uid();
    if found then raise exception 'A could delete usage_events'; end if;
  exception when insufficient_privilege then null; end;

  -- cannot write favorites for someone else
  begin
    insert into public.saved_ads (user_id, ad_id) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-0000000000a2');
    raise exception 'A could write a favorite for B';
  exception when insufficient_privilege then null; end;

  -- collections are created server-side only (plan limits)
  begin
    insert into public.collections (user_id, name) values (auth.uid(), 'bypass');
    raise exception 'A could bypass collection limits';
  exception when insufficient_privilege then null; end;

  -- cannot add items to B's private collection
  begin
    insert into public.collection_items (collection_id, ad_id, added_by)
      values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', auth.uid());
    raise exception 'A could add to B collection';
  exception when insufficient_privilege then null; end;

  -- ads are written by the server only
  begin
    insert into public.ads (source, source_ad_id) values ('meta', 'fake');
    raise exception 'A could insert ads';
  exception when insufficient_privilege then null; end;

  -- cannot modify B's rows (silently filtered)
  update public.saved_ads set note = 'hacked' where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  delete from public.collections where id = '00000000-0000-0000-0000-0000000000c1';
end $$;
commit;

do $$ begin
  if exists (select 1 from public.saved_ads where note = 'hacked') then raise exception 'A modified B favorite'; end if;
  if not exists (select 1 from public.collections where id = '00000000-0000-0000-0000-0000000000c1') then raise exception 'A deleted B collection'; end if;
  if (select role from public.profiles where email = 'a@test.dev') <> 'user' then raise exception 'role changed'; end if;
  if (select full_name from public.profiles where email = 'a@test.dev') <> 'Alice B.' then raise exception 'own profile update failed'; end if;
end $$;

-- Team sharing ---------------------------------------------------------------
insert into public.teams (id, name, owner_id) values ('00000000-0000-0000-0000-0000000000f1', 'Agency', :B);
insert into public.team_members (team_id, user_id, role) values ('00000000-0000-0000-0000-0000000000f1', :B, 'owner'), ('00000000-0000-0000-0000-0000000000f1', :A, 'member');
insert into public.collections (id, user_id, team_id, name) values ('00000000-0000-0000-0000-0000000000c2', :B, '00000000-0000-0000-0000-0000000000f1', 'Shared');

begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
do $$ begin
  if (select count(*) from public.collections) <> 1 then raise exception 'team member should see exactly the shared collection'; end if;
end $$;
insert into public.collection_items (collection_id, ad_id, added_by)
  values ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1', auth.uid());
do $$ begin
  -- members cannot rename or delete the owner's collection
  update public.collections set name = 'renamed' where id = '00000000-0000-0000-0000-0000000000c2';
  delete from public.collections where id = '00000000-0000-0000-0000-0000000000c2';
end $$;
commit;

do $$ begin
  if (select name from public.collections where id = '00000000-0000-0000-0000-0000000000c2') <> 'Shared' then raise exception 'member renamed owner collection'; end if;
  if (select count(*) from public.collection_items where collection_id = '00000000-0000-0000-0000-0000000000c2') <> 1 then raise exception 'member could not add to team collection'; end if;
end $$;

-- Anonymous visitors ---------------------------------------------------------
begin;
set local role anon;
do $$ begin
  if (select count(*) from public.ads) <> 0 then raise exception 'anon can read ads'; end if;
  if (select count(*) from public.profiles) <> 0 then raise exception 'anon can read profiles'; end if;
  if (select count(*) from public.plans) <> 3 then raise exception 'anon cannot read plans (pricing page)'; end if;
end $$;
commit;

-- Quota function (service role) ------------------------------------------------
begin;
set local role service_role;
do $$
declare u uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
begin
  if not public.consume_quota(u, 'analysis', 2, date_trunc('month', now())) then raise exception 'quota 1/2 refused'; end if;
  if not public.consume_quota(u, 'analysis', 2, date_trunc('month', now())) then raise exception 'quota 2/2 refused'; end if;
  if public.consume_quota(u, 'analysis', 2, date_trunc('month', now())) then raise exception 'quota 3/2 accepted'; end if;
  perform public.refund_quota(u, 'analysis');
  if not public.consume_quota(u, 'analysis', 2, date_trunc('month', now())) then raise exception 'refund did not free a unit'; end if;
  if public.consume_quota(u, 'creation', 0, date_trunc('month', now())) then raise exception 'limit 0 accepted'; end if;
  if not public.consume_quota(u, 'search', -1, date_trunc('month', now())) then raise exception 'unlimited refused'; end if;
  -- previous period usage does not count
  insert into public.usage_events (user_id, kind, created_at) values (u, 'export', now() - interval '40 days');
  if not public.consume_quota(u, 'export', 1, date_trunc('month', now())) then raise exception 'old usage counted'; end if;
end $$;
commit;

-- Account deletion cascades ------------------------------------------------------
delete from auth.users where id = :A;
do $$ begin
  if exists (select 1 from public.saved_ads where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') then raise exception 'favorites not deleted'; end if;
  if exists (select 1 from public.usage_events where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') then raise exception 'usage not deleted'; end if;
  if exists (select 1 from public.profiles where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') then raise exception 'profile not deleted'; end if;
end $$;

select 'ALL RLS TESTS PASSED' as result;
