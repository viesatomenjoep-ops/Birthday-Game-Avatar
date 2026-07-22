-- Migratie: kostuum + eigen uitnodigingstekst
-- Uitvoeren in de SQL Editor van je Supabase-project (veilig, idempotent).

alter table public.games add column if not exists costume text;
alter table public.games add column if not exists invitation jsonb;
