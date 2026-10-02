-- Místa: kam se chci podívat a kde jsem byl, se seznamy (výlety, restaurace…)

create table public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  address text check (char_length(address) <= 300),
  list text check (char_length(list) <= 60),
  status text not null default 'chci' check (status in ('chci', 'byl')),
  note text check (char_length(note) <= 1000),
  url text check (char_length(url) <= 2000),
  visited_at date,
  created_at timestamptz not null default now()
);

create index places_user_created on public.places (user_id, created_at desc);

alter table public.places enable row level security;

grant select, insert, update, delete on public.places to authenticated;

create policy "Vlastník spravuje svá místa"
  on public.places for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
