-- Meditace: historie sezení a týdenní cíl

create table public.meditations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  duration_s integer not null check (duration_s > 0 and duration_s <= 86400),
  note text,
  created_at timestamptz not null default now()
);

create index meditations_user_started_at on public.meditations (user_id, started_at desc);

alter table public.meditations enable row level security;

grant select, insert, update, delete on public.meditations to authenticated;

create policy "Vlastník spravuje své meditace"
  on public.meditations for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.user_settings
  add column meditation_weekly_goal integer not null default 5 check (meditation_weekly_goal between 1 and 14);
