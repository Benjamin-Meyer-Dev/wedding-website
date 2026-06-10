-- Pre-launch lockdown: defense-in-depth for the public deployment.
--
-- Context (verified by live probing on 2026-06-09):
--   * RLS is enabled and blocks anonymous reads/writes today.
--   * BUT the `anon` role still holds table-level SELECT on these tables —
--     reads are stopped only by the RLS policy function. Removing anon's
--     privileges entirely means a future mis-edited policy still can't leak
--     anything to the public key (which ships in the published bundle).
--
-- This migration is idempotent and safe to re-run. It does NOT touch the
-- `authenticated` role, so logged-in guests are unaffected. The `service_role`
-- bypasses RLS/grants regardless, so admin tooling is unaffected.
--
-- Run it in the Supabase SQL editor (or `supabase db push` once linked).
-- NOTE: disabling public sign-up is GoTrue auth config, NOT a database setting,
-- so it cannot live here — see the project notes / Management API command.

-- ---------- 1. Assert RLS is on (idempotent) ----------
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.rsvps             enable row level security;

-- ---------- 2. Strip ALL privileges from the public (anon) key ----------
-- The app only ever reads/writes these tables from an authenticated session,
-- so anon needs no access at all. This removes the lingering SELECT grant the
-- probe revealed, making anon access fail at the table grant — before any
-- policy is even evaluated.
revoke all on public.households        from anon;
revoke all on public.household_members from anon;
revoke all on public.rsvps             from anon;

-- ---------- 3. Keep anon from executing the RLS helper directly ----------
-- Defensive: ensure the policy helper can't be called by the public role.
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'current_user_household_id'
  ) then
    execute 'revoke all on function public.current_user_household_id() from anon, public';
  end if;
end $$;

-- ============================================================
-- AUDIT QUERIES (run these and eyeball the output — not assertions)
-- ============================================================
-- (a) RLS must be true for all three tables:
--   select relname, relrowsecurity as rls_enabled
--   from pg_class where relname in ('households','household_members','rsvps');
--
-- (b) Every policy's qual/with_check must reference auth.uid() (directly or via
--     the helper fn). NONE should target the 'anon' role or use a bare 'true':
--   select tablename, policyname, roles, cmd, qual, with_check
--   from pg_policies where schemaname='public' order by tablename, policyname;
--
-- (c) Confirm anon now has no table privileges (should return zero rows):
--   select grantee, table_name, privilege_type
--   from information_schema.role_table_grants
--   where table_schema='public'
--     and table_name in ('households','household_members','rsvps')
--     and grantee='anon';
