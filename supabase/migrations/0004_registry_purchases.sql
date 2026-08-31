-- Registry self-reported purchases.
--
-- Guests mark a registry item as purchased (or the honeymoon fund as
-- contributed) on the Gifts page. One row per (item, household): exclusive
-- gifts are shown as taken to everyone once any household claims them, while
-- the fund accepts a row from every household. Marking is voluntary — the
-- Buy/Contribute button is a plain link and never writes here.
--
-- The browser is not a security boundary (see 0002): anyone with a session can
-- hit the REST API directly, so the RLS policies below are the real
-- enforcement. Same lockdown stance as 0003: the anon (public) key gets
-- nothing at the grant level.
--
-- Run manually in the Supabase SQL editor (like 0002/0003). Idempotent.

create table if not exists public.registry_purchases (
  item_key     text not null check (char_length(item_key) <= 100),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key (item_key, household_id)
);

alter table public.registry_purchases enable row level security;

revoke all on public.registry_purchases from anon;
grant select, insert, delete on public.registry_purchases to authenticated;
-- no UPDATE grant or policy on purpose: rows are only ever created and removed

-- Every signed-in guest sees all purchases (the UI shows claimed gifts as taken).
drop policy if exists registry_purchases_select on public.registry_purchases;
create policy registry_purchases_select on public.registry_purchases
  for select to authenticated
  using (
    exists (select 1 from public.household_members m where m.user_id = auth.uid())
  );

-- Guests may mark a purchase only as themselves, for their own household.
drop policy if exists registry_purchases_insert on public.registry_purchases;
create policy registry_purchases_insert on public.registry_purchases
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and household_id in (
      select m.household_id from public.household_members m where m.user_id = auth.uid()
    )
  );

-- Anyone in the same household may unmark; never across households.
drop policy if exists registry_purchases_delete on public.registry_purchases;
create policy registry_purchases_delete on public.registry_purchases
  for delete to authenticated
  using (
    household_id in (
      select m.household_id from public.household_members m where m.user_id = auth.uid()
    )
  );

-- ============================================================
-- AUDIT QUERIES (eyeball after running — not assertions)
-- ============================================================
-- (a) RLS on:
--   select relname, relrowsecurity from pg_class where relname = 'registry_purchases';
-- (b) anon has zero privileges (should return no rows):
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_schema='public' and table_name='registry_purchases' and grantee='anon';
