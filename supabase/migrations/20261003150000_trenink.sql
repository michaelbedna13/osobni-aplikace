-- Trénink: vlastní cviky, šablony tréninků a odcvičené tréninky (série jsou uložené v JSON u tréninku)

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  -- weight_reps = váha × opakování, reps = jen opakování, time = výdrž v sekundách
  kind text not null check (kind in ('weight_reps', 'reps', 'time')),
  category text not null check (category in ('cinky', 'vaha', 'jine')),
  rest_s integer not null default 90 check (rest_s between 0 and 600),
  created_at timestamptz not null default now()
);

create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  -- [{ "exercise_id": "...", "sets": 3 }]
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  created_at timestamptz not null default now()
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  template_id uuid references public.workout_templates (id) on delete set null,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  -- [{ "exercise_id": "...", "sets": [{ "weight": 20, "reps": 10, "seconds": null, "done": true }] }]
  exercises jsonb not null default '[]'::jsonb check (jsonb_typeof(exercises) = 'array'),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  check (finished_at >= started_at)
);

create index workouts_user_started_at on public.workouts (user_id, started_at desc);

alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workouts enable row level security;

grant select, insert, update, delete on public.exercises to authenticated;
grant select, insert, update, delete on public.workout_templates to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;

create policy "Vlastník spravuje své cviky"
  on public.exercises for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Vlastník spravuje své šablony tréninků"
  on public.workout_templates for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Vlastník spravuje své tréninky"
  on public.workouts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table public.user_settings
  add column workout_weekly_goal integer not null default 3 check (workout_weekly_goal between 1 and 14);
