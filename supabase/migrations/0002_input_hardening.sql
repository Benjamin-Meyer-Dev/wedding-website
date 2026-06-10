-- Server-side guards on user-supplied values.
--
-- The browser is not a security boundary: anyone with a valid session can call
-- the Supabase REST API directly (curl / devtools), bypassing every check in the
-- React app. So length and format limits must live in the database. The
-- constraints below only REJECT abusive values — valid RSVPs are unaffected.
--
-- Run this against the live database (Supabase SQL editor, or `supabase db push`).
-- It is idempotent and column-aware, so it is safe to re-run and tolerant of the
-- schema drift between 0001 and the table the app actually uses.

-- ---------- rsvps: cap free text, whitelist choices, bound counts ----------
do $$
declare
  has_dietary boolean;
  has_notes   boolean;
  has_meal    boolean;
  has_guest   boolean;
  attending_type text;
begin
  select exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='rsvps' and column_name='dietary_notes') into has_dietary;
  select exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='rsvps' and column_name='notes') into has_notes;
  select exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='rsvps' and column_name='meal_choice') into has_meal;
  select exists (select 1 from information_schema.columns
    where table_schema='public' and table_name='rsvps' and column_name='guest_count') into has_guest;
  select data_type from information_schema.columns
    where table_schema='public' and table_name='rsvps' and column_name='attending' into attending_type;

  if has_dietary and not exists (select 1 from pg_constraint where conname='rsvps_dietary_notes_len') then
    alter table public.rsvps add constraint rsvps_dietary_notes_len
      check (dietary_notes is null or char_length(dietary_notes) <= 500);
  end if;

  if has_notes and not exists (select 1 from pg_constraint where conname='rsvps_notes_len') then
    alter table public.rsvps add constraint rsvps_notes_len
      check (notes is null or char_length(notes) <= 500);
  end if;

  if has_meal and not exists (select 1 from pg_constraint where conname='rsvps_meal_choice_chk') then
    alter table public.rsvps add constraint rsvps_meal_choice_chk
      check (meal_choice is null or meal_choice in ('chicken','beef','fish','vegetarian','vegan'));
  end if;

  -- only meaningful when attending is stored as text ('yes'/'no'); skip if boolean
  if attending_type in ('text','character varying')
     and not exists (select 1 from pg_constraint where conname='rsvps_attending_chk') then
    alter table public.rsvps add constraint rsvps_attending_chk
      check (attending is null or attending in ('yes','no'));
  end if;

  if has_guest and not exists (select 1 from pg_constraint where conname='rsvps_guest_count_chk') then
    alter table public.rsvps add constraint rsvps_guest_count_chk
      check (guest_count is null or (guest_count >= 0 and guest_count <= 50));
  end if;
end $$;

-- ---------- household_members: bound the editable display name ----------
do $$
begin
  if exists (select 1 from information_schema.columns
       where table_schema='public' and table_name='household_members' and column_name='first_name')
     and not exists (select 1 from pg_constraint where conname='household_members_first_name_len') then
    alter table public.household_members add constraint household_members_first_name_len
      check (first_name is null or char_length(first_name) <= 100);
  end if;
end $$;
