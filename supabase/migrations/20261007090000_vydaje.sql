-- Finance: pravidelné výdaje (nájem, internet, energie…)

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  amount numeric(10, 2) not null check (amount >= 0),
  period text not null default 'mesic' check (period in ('mesic', 'ctvrtleti', 'rok')),
  -- den v měsíci, kdy se platí (jen u měsíčních výdajů)
  due_day smallint check (due_day between 1 and 31),
  note text check (char_length(note) <= 500),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

grant select, insert, update, delete on public.expenses to authenticated;

create policy "Vlastník spravuje své výdaje"
  on public.expenses for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
