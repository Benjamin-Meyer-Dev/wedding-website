-- Guest surnames, used to build each household's username
-- (scripts/create-household-logins.mjs): the household's distinct surnames,
-- in guest order, max two — "smith", "smithjones".
--
-- Nullable so existing guests keep working; fill them in before generating
-- logins. Guests can't edit this (no update grant on guests, 0008).
--
-- Run manually in the Supabase SQL editor. Idempotent.

alter table public.guests
  add column if not exists last_name text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'guests_last_name_len') then
    alter table public.guests add constraint guests_last_name_len
      check (last_name is null or char_length(last_name) <= 100);
  end if;
end $$;

-- Filling in existing guests:
--   update public.guests set last_name = 'Smith' where id = '<guest id>';
--
-- Or add a household with surnames from the start:
--   with h as (insert into public.households (display_name) values ('Anna & Tom') returning id)
--   insert into public.guests (household_id, first_name, last_name)
--   select h.id, g.first, g.last from h,
--     (values ('Anna','Smith'), ('Tom','Jones')) as g(first, last);
--
-- Guests still missing a surname (the script skips their households):
--   select h.display_name, g.first_name from public.guests g
--   join public.households h on h.id = g.household_id where g.last_name is null;
