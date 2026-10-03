-- Dechová cvičení: odcvičená sezení (u Wima Hofa i časy zadržení dechu)

create table public.breathing_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise text not null check (char_length(exercise) <= 40),
  started_at timestamptz not null,
  duration_s integer not null check (duration_s between 1 and 14400),
  cycles integer not null default 0 check (cycles >= 0),
  -- Wim Hof: zadržení dechu na prázdno v jednotlivých kolech (s)
  holds integer[] not null default '{}',
  created_at timestamptz not null default now()
);

create index breathing_sessions_user_started on public.breathing_sessions (user_id, started_at desc);

alter table public.breathing_sessions enable row level security;

grant select, insert, update, delete on public.breathing_sessions to authenticated;

create policy "Vlastník spravuje svá dechová cvičení"
  on public.breathing_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
