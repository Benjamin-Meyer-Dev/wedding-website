-- Households: a shared "account" for a couple/family
-- Each auth user is a member of exactly one household, and all shared data
-- (RSVPs, registry interactions, etc.) is keyed by household_id.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  created_at timestamptz default now()
);

create table public.household_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  first_name text,
  added_at timestamptz default now()
);
create index household_members_household_id_idx on public.household_members(household_id);

create table public.rsvps (
  household_id uuid primary key references public.households(id) on delete cascade,
  attending boolean,
  guest_count int,
  meal_choice text,
  notes text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- ---------- Row-level security ----------
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.rsvps enable row level security;

-- A user can read their own membership row
create policy "self membership read" on public.household_members
  for select using (user_id = auth.uid());

-- A user can read the household they belong to
create policy "own household read" on public.households
  for select using (id in (
    select household_id from public.household_members where user_id = auth.uid()
  ));

-- A user can read/write their household's RSVP
create policy "household rsvp read" on public.rsvps
  for select using (household_id in (
    select household_id from public.household_members where user_id = auth.uid()
  ));

create policy "household rsvp upsert" on public.rsvps
  for insert with check (household_id in (
    select household_id from public.household_members where user_id = auth.uid()
  ));

create policy "household rsvp update" on public.rsvps
  for update using (household_id in (
    select household_id from public.household_members where user_id = auth.uid()
  )) with check (household_id in (
    select household_id from public.household_members where user_id = auth.uid()
  ));
