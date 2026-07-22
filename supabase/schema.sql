-- Birthday Game Avatar — Supabase schema
-- Uitvoeren in de SQL Editor van je Supabase-project.

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  child_name text not null check (char_length(child_name) between 1 and 40),
  age integer not null check (age between 1 and 18),
  party_date date not null,
  party_time time not null,
  avatar_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists games_slug_idx on public.games (slug);

-- Row Level Security: iedereen mag een game LEZEN (de deelbare link),
-- maar schrijven kan alleen via de service-role key (API-route, omzeilt RLS).
alter table public.games enable row level security;

drop policy if exists "Public read access via slug" on public.games;
create policy "Public read access via slug"
  on public.games
  for select
  to anon, authenticated
  using (true);

-- Bewust GEEN insert/update/delete policies: de anon key kan dus niets muteren.
