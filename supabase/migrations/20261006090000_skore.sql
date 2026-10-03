-- Skóre na hry: šipky, mölkky, pétanque a vlastní hry (zápisy jsou v JSON u hry)

create table public.score_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('sipky', 'molkky', 'petanque', 'vlastni')),
  -- { "start": 501 } | { "target": 13 } | { "target": 100, "lowWins": true }
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  players text[] not null check (cardinality(players) between 1 and 8),
  -- zápisy v pořadí: [{ "p": index hráče, "v": body }, …]
  turns jsonb not null default '[]'::jsonb check (jsonb_typeof(turns) = 'array'),
  -- index vítěze v poli players, null = bez vítěze
  winner integer,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index score_games_user_started on public.score_games (user_id, started_at desc);

alter table public.score_games enable row level security;

grant select, insert, update, delete on public.score_games to authenticated;

create policy "Vlastník spravuje své hry"
  on public.score_games for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
