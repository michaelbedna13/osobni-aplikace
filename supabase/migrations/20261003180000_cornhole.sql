-- Cornhole: týmy (s hráči) a odehrané hry (kola jsou uložená v JSON u hry)

create table public.cornhole_teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  players text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.cornhole_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  -- soucet = každý tým si přičte svoje, rozdil = boduje jen nejlepší tým v kole (rozdílem)
  mode text not null check (mode in ('soucet', 'rozdil')),
  target integer not null check (target between 1 and 200),
  -- snímek týmů v době hry: [{ "team_id", "name", "color", "players": [] }]
  teams jsonb not null check (jsonb_typeof(teams) = 'array'),
  -- kola: [[{ "board": 2, "hole": 1 }, …pro každý tým], …]
  rounds jsonb not null default '[]'::jsonb check (jsonb_typeof(rounds) = 'array'),
  -- index vítězného týmu v poli teams, null = bez vítěze
  winner integer,
  created_at timestamptz not null default now()
);

create index cornhole_games_user_started on public.cornhole_games (user_id, started_at desc);

alter table public.cornhole_teams enable row level security;
alter table public.cornhole_games enable row level security;

grant select, insert, update, delete on public.cornhole_teams to authenticated;
grant select, insert, update, delete on public.cornhole_games to authenticated;

create policy "Vlastník spravuje své týmy"
  on public.cornhole_teams for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Vlastník spravuje své hry"
  on public.cornhole_games for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
