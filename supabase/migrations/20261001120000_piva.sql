-- Piva: jeden řádek = jeden vypitý půllitr

create table public.beers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  drunk_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index beers_user_drunk_at on public.beers (user_id, drunk_at desc);

alter table public.beers enable row level security;

grant select, insert, update, delete on public.beers to authenticated;

create policy "Vlastník spravuje svá piva"
  on public.beers for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
