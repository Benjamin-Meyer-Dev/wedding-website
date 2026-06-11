-- Guest email capture for the post-login "email me the site link" popup.
--
-- Two columns on household_members:
--   email              the address the guest chose to share (null if declined)
--   email_prompted_at  set once the guest answers the popup (send OR decline),
--                      so they are never asked again. Null = not asked yet.
--
-- Guests may update ONLY these two columns, and only on their own row: the
-- app never edits first_name / household_id from the browser, so the update
-- grant is column-scoped and the policy is keyed to auth.uid(). The browser
-- is not a security boundary (see 0002) — this is the real enforcement.
--
-- Run manually in the Supabase SQL editor (like 0002-0005). Idempotent.

alter table public.household_members
  add column if not exists email text,
  add column if not exists email_prompted_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'household_members_email_chk') then
    alter table public.household_members add constraint household_members_email_chk
      check (email is null or (char_length(email) <= 255 and email like '%_@_%.__%'));
  end if;
end $$;

-- column-scoped: revoke blanket update, re-grant just the email fields
revoke update on public.household_members from authenticated;
grant update (email, email_prompted_at) on public.household_members to authenticated;

drop policy if exists household_members_self_update on public.household_members;
create policy household_members_self_update on public.household_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- AUDIT QUERIES (eyeball after running)
-- ============================================================
-- (a) authenticated should hold UPDATE on ONLY email / email_prompted_at:
--   select privilege_type, column_name from information_schema.column_privileges
--   where table_schema='public' and table_name='household_members'
--     and grantee='authenticated' and privilege_type='UPDATE';
-- (b) the update policy must be keyed to auth.uid():
--   select policyname, cmd, qual, with_check from pg_policies
--   where tablename='household_members';
