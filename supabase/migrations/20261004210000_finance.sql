-- Finance: předplatné, dluhy, spořicí cíle a cena piva (útrata za piva)

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  price numeric(10, 2) not null check (price >= 0),
  period text not null default 'mesic' check (period in ('tyden', 'mesic', 'rok')),
  -- nejbližší (nebo poslední známé) datum obnovy; další se dopočítají
  next_date date not null,
  note text check (char_length(note) <= 500),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person text not null check (char_length(person) between 1 and 80),
  amount numeric(10, 2) not null check (amount > 0),
  -- mi = dluží mi, ja = dlužím já
  direction text not null check (direction in ('mi', 'ja')),
  note text check (char_length(note) <= 500),
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  target numeric(12, 2) not null check (target > 0),
  saved numeric(12, 2) not null default 0 check (saved >= 0),
  deadline date,
  created_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
alter table public.debts enable row level security;
alter table public.savings_goals enable row level security;

grant select, insert, update, delete on public.subscriptions to authenticated;
grant select, insert, update, delete on public.debts to authenticated;
grant select, insert, update, delete on public.savings_goals to authenticated;

create policy "Vlastník spravuje svá předplatná"
  on public.subscriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Vlastník spravuje své dluhy"
  on public.debts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Vlastník spravuje své spořicí cíle"
  on public.savings_goals for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table public.user_settings
  add column beer_price numeric(6, 2) not null default 55 check (beer_price >= 0);
