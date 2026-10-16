-- One login per household instead of one per guest.
--
-- Before: every guest was an auth user, linked to a household through
-- household_members, and RSVPs / registry marks / the email prompt were keyed
-- by that guest's auth.uid().
--
-- After:
--   households.user_id   the household's single login (auth.users row)
--   guests               the people invited under a household — names only,
--                        no login. RSVPs are still one row per guest.
--   households.email / email_prompted_at
--                        the "email me the site link" popup is answered once
--                        per household (moved off household_members, 0006)
--
-- Existing data is carried over: each household_members row becomes a guest
-- with the SAME id (the old user_id), so existing rsvps rows map across by a
-- plain column rename. household_members is then dropped.
--
-- The live schema drifted from 0001 (see ROADMAP notes), so this is written
-- defensively: every policy on the touched tables is dropped by catalog lookup
-- rather than by name, and FKs on rsvps are found the same way.
--
-- Run manually in the Supabase SQL editor (like 0002-0007). Runs in one
-- transaction — if anything fails, nothing changes.

begin;

-- ---------- 1. Drop every existing policy on the touched tables ----------
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('households','household_members','rsvps','registry_purchases')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- ---------- 2. households: one login + the email prompt ----------
alter table public.households
  add column if not exists user_id uuid unique references auth.users(id) on delete set null,
  add column if not exists email text,
  add column if not exists email_prompted_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'households_email_chk') then
    alter table public.households add constraint households_email_chk
      check (email is null or (char_length(email) <= 255 and email like '%_@_%.__%'));
  end if;
end $$;

-- ---------- 3. guests: the people in each household (no logins) ----------
create table if not exists public.guests (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  first_name   text not null check (char_length(first_name) <= 100),
  created_at   timestamptz not null default now()
);
create index if not exists guests_household_id_idx on public.guests(household_id);

-- surnames build the household usernames (constraint added in 0009)
alter table public.guests add column if not exists last_name text;

-- carry existing members across, keeping their id so rsvps still line up,
-- along with any last names entered under 0007
do $$
begin
  if to_regclass('public.household_members') is not null then
    if exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='household_members' and column_name='last_name') then
      execute $q$
        insert into public.guests (id, household_id, first_name, last_name)
        select user_id, household_id, coalesce(nullif(trim(first_name), ''), 'Guest'), nullif(trim(last_name), '')
        from public.household_members
        on conflict (id) do nothing
      $q$;
    else
      insert into public.guests (id, household_id, first_name)
      select user_id, household_id, coalesce(nullif(trim(first_name), ''), 'Guest')
      from public.household_members
      on conflict (id) do nothing;
    end if;
  end if;
end $$;

-- ---------- 4. rsvps: keyed by guest instead of auth user ----------
do $$
declare c record;
begin
  -- drop FKs pointing at auth.users (user_id / updated_by): deleting the old
  -- per-guest logins must not cascade away their RSVPs
  for c in
    select conname from pg_constraint
    where conrelid = 'public.rsvps'::regclass and contype = 'f'
      and confrelid = 'auth.users'::regclass
  loop
    execute format('alter table public.rsvps drop constraint %I', c.conname);
  end loop;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='rsvps' and column_name='user_id') then
    alter table public.rsvps rename column user_id to guest_id;
  end if;
end $$;

alter table public.rsvps drop column if exists updated_by;

-- orphans (no matching guest) can't satisfy the new FK
delete from public.rsvps r where not exists (select 1 from public.guests g where g.id = r.guest_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'rsvps_guest_id_fkey') then
    alter table public.rsvps add constraint rsvps_guest_id_fkey
      foreign key (guest_id) references public.guests(id) on delete cascade;
  end if;
  -- the app upserts on guest_id; the renamed user_id column normally carries
  -- its unique/PK over, but make sure
  if not exists (
    select 1 from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
    where i.indrelid = 'public.rsvps'::regclass and i.indisunique
      and i.indnkeyatts = 1 and a.attname = 'guest_id'
  ) then
    alter table public.rsvps add constraint rsvps_guest_id_key unique (guest_id);
  end if;
end $$;

-- ---------- 5. registry_purchases: no per-person attribution any more ----------
alter table public.registry_purchases drop column if exists user_id;

-- ---------- 6. Drop the old membership table ----------
drop table if exists public.household_members;

-- ---------- 7. RLS helper: the signed-in household ----------
drop function if exists public.current_user_household_id();
create function public.current_user_household_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select id from public.households where user_id = auth.uid()
$$;
revoke all on function public.current_user_household_id() from anon, public;
grant execute on function public.current_user_household_id() to authenticated;

-- ---------- 8. Grants: anon gets nothing, authenticated only what the app uses ----------
alter table public.households         enable row level security;
alter table public.guests             enable row level security;
alter table public.rsvps              enable row level security;
alter table public.registry_purchases enable row level security;

revoke all on public.households, public.guests, public.rsvps, public.registry_purchases from anon;
revoke all on public.households, public.guests, public.rsvps, public.registry_purchases from authenticated;

grant select on public.households to authenticated;
grant update (email, email_prompted_at) on public.households to authenticated;
grant select on public.guests to authenticated;
grant select, insert, update on public.rsvps to authenticated;
grant select, insert, delete on public.registry_purchases to authenticated;

-- ---------- 9. Policies ----------
create policy households_select on public.households
  for select to authenticated
  using (user_id = auth.uid());

create policy households_update on public.households
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy guests_select on public.guests
  for select to authenticated
  using (household_id = public.current_user_household_id());

create policy rsvps_select on public.rsvps
  for select to authenticated
  using (household_id = public.current_user_household_id());

-- a household may only answer for its own guests
create policy rsvps_insert on public.rsvps
  for insert to authenticated
  with check (
    household_id = public.current_user_household_id()
    and exists (select 1 from public.guests g
                where g.id = guest_id and g.household_id = public.current_user_household_id())
  );

create policy rsvps_update on public.rsvps
  for update to authenticated
  using (household_id = public.current_user_household_id())
  with check (
    household_id = public.current_user_household_id()
    and exists (select 1 from public.guests g
                where g.id = guest_id and g.household_id = public.current_user_household_id())
  );

-- every signed-in household sees all marks (claimed gifts show as taken)
create policy registry_purchases_select on public.registry_purchases
  for select to authenticated
  using (public.current_user_household_id() is not null);

create policy registry_purchases_insert on public.registry_purchases
  for insert to authenticated
  with check (household_id = public.current_user_household_id());

create policy registry_purchases_delete on public.registry_purchases
  for delete to authenticated
  using (household_id = public.current_user_household_id());

commit;

-- ============================================================
-- AFTER RUNNING: give each household its login
-- ============================================================
-- 1. Authentication → Users → Add user, for each household:
--      email     <username>@wedding.local   (the username guests type)
--      password  whatever goes on the invitation
--      Auto Confirm User: ON
--
-- 2. Link the login to its household (existing households):
--      update public.households
--      set user_id = (select id from auth.users where email = 'smiths@wedding.local')
--      where display_name = 'The Smiths';
--
--    Or create a brand-new household with its guests:
--      with h as (
--        insert into public.households (display_name, user_id)
--        values ('The Smiths', (select id from auth.users where email = 'smiths@wedding.local'))
--        returning id
--      )
--      insert into public.guests (household_id, first_name)
--      select h.id, n from h, unnest(array['Anna','Tom']) as n;
--
-- 3. Delete the old per-guest logins (their RSVPs are safe — they now hang
--    off guests). Authentication → Users, or:
--      delete from auth.users
--      where email like '%@wedding.local'
--        and id not in (select user_id from public.households where user_id is not null);
--
-- ============================================================
-- AUDIT QUERIES (eyeball after running)
-- ============================================================
-- (a) every household has a login (should return zero rows once linked):
--   select id, display_name from public.households where user_id is null;
-- (b) policies all key off auth.uid() / the helper:
--   select tablename, policyname, cmd, qual, with_check from pg_policies
--   where schemaname = 'public' order by tablename, policyname;
-- (c) anon has no privileges (should return zero rows):
--   select table_name, privilege_type from information_schema.role_table_grants
--   where table_schema = 'public' and grantee = 'anon';
