-- Creates a login for every household that doesn't have one yet — SQL-editor
-- version of scripts/create-household-logins.mjs, same username rule:
-- the household's distinct surnames, alphabetical, max two, lowercased with
-- spaces/punctuation stripped ("Van Dam" + "Meyer" -> meyervandam). A taken
-- username gets a number (smith2).
--
-- Every new login gets the password set on the `pw` line below. Writing to
-- auth.users directly skips Supabase's minimum-length rule, so short test
-- passwords work — change them before invitations go out.
--
-- Households with no guests, or a guest without a last_name, are skipped
-- (listed under Messages / notices). Safe to re-run: households that already
-- have a login are left alone.

do $$
declare
  pw    text := 'test';
  h     record;
  uname text;
  n     int;
  uid   uuid;
begin
  for h in
    select hh.id, hh.display_name,
      (select string_agg(s, '' order by s) from (
         select s from (
           select distinct regexp_replace(lower(g.last_name), '[^a-z0-9]', '', 'g') as s
           from public.guests g where g.household_id = hh.id
         ) d where s <> '' order by s limit 2
       ) top2) as base,
      exists (select 1 from public.guests g
              where g.household_id = hh.id and coalesce(trim(g.last_name), '') = '') as missing,
      exists (select 1 from public.guests g where g.household_id = hh.id) as has_guests
    from public.households hh
    where hh.user_id is null
    order by 3
  loop
    if not h.has_guests or h.missing or h.base is null then
      raise notice 'SKIPPED %: no guests, or a guest has no last_name', h.display_name;
      continue;
    end if;

    uname := h.base;
    n := 1;
    while exists (select 1 from auth.users where email = uname || '@wedding.local') loop
      n := n + 1;
      uname := h.base || n;
    end loop;

    uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      uname || '@wedding.local', extensions.crypt(pw, extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(),
      '', '', '', ''  -- must be '' not null, or sign-in errors
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, uid::text, 'email',
      jsonb_build_object('sub', uid::text, 'email', uname || '@wedding.local', 'email_verified', true),
      now(), now(), now()
    );

    update public.households set user_id = uid where id = h.id;
  end loop;
end $$;

-- Result: every household and its username
select h.display_name,
       split_part(u.email, '@', 1) as username,
       (select string_agg(g.first_name, ', ' order by g.first_name)
          from public.guests g where g.household_id = h.id) as guests
from public.households h
left join auth.users u on u.id = h.user_id
order by username nulls last;
