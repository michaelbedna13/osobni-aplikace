-- Wishlist: věci, co chci koupit; cena, priorita, pravidlo 30 dní

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  url text check (char_length(url) <= 2000),
  image_url text check (char_length(image_url) <= 2000),
  site text check (char_length(site) <= 200),
  price numeric(12, 2) check (price >= 0),
  -- 1 = až někdy, 2 = chci, 3 = moc chci
  priority smallint not null default 2 check (priority between 1 and 3),
  status text not null default 'chci' check (status in ('chci', 'koupeno', 'nechci')),
  -- pravidlo 30 dní: do tohoto dne se nekupuje
  wait_until date,
  note text check (char_length(note) <= 1000),
  preview_done boolean not null default false,
  closed_at date,
  created_at timestamptz not null default now()
);

create index wishes_user_created on public.wishes (user_id, created_at desc);

alter table public.wishes enable row level security;

grant select, insert, update, delete on public.wishes to authenticated;

create policy "Vlastník spravuje svá přání"
  on public.wishes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
