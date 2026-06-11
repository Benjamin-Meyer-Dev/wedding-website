-- Live registry updates: broadcast registry_purchases changes over Supabase
-- Realtime (the platform's built-in websocket), so a gift marked on one phone
-- shows as taken on every other open Gifts page immediately and nobody
-- double-buys. No custom socket server is involved: adding the table to the
-- `supabase_realtime` publication is what makes Postgres emit the change
-- events that Realtime fans out to subscribed clients (Registry.jsx).
--
-- Security notes:
--   * INSERT events are filtered per-subscriber by the table's RLS SELECT
--     policy (0004): only signed-in household members receive row data; the
--     anon key receives nothing.
--   * DELETE events carry only the primary key (item_key, household_id) —
--     replica identity default. That pair is non-sensitive (an opaque uuid).
--
-- Run manually in the Supabase SQL editor (like 0002-0004). Idempotent.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'registry_purchases'
  ) then
    alter publication supabase_realtime add table public.registry_purchases;
  end if;
end $$;

-- ============================================================
-- AUDIT QUERY (eyeball after running)
-- ============================================================
-- The table should appear in the realtime publication:
--   select * from pg_publication_tables where pubname = 'supabase_realtime';
