-- Last names for household members.
--
-- The app only ever shows first names, and only to people in the same
-- household, so this column is for us: it tells two guests with the same first
-- name apart in the table editor and in RSVP / registry exports.
--
-- Guests cannot write it: 0006 scoped the authenticated UPDATE grant to
-- (email, email_prompted_at), so any new column is read-only to them.
--
-- Run manually in the Supabase SQL editor (like 0002-0006). Idempotent.

alter table public.household_members
  add column if not exists last_name text;
