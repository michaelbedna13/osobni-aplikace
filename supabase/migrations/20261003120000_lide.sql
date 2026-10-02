-- Lidé a dárky: narozeniny, jmeniny a nápady na dárky

create table public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  birth_day smallint check (birth_day between 1 and 31),
  birth_month smallint check (birth_month between 1 and 12),
  birth_year smallint check (birth_year between 1900 and 2100),
  -- jmeniny ve tvaru MM-DD (doplní se podle jména, jdou vypnout)
  nameday text check (nameday ~ '^[0-9]{2}-[0-9]{2}$'),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  check ((birth_day is null) = (birth_month is null))
);

create index people_user on public.people (user_id);

create table public.gift_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  url text check (char_length(url) <= 2000),
  given_at timestamptz,
  created_at timestamptz not null default now()
);

create index gift_ideas_user_person on public.gift_ideas (user_id, person_id);

alter table public.people enable row level security;
alter table public.gift_ideas enable row level security;

grant select, insert, update, delete on public.people to authenticated;
grant select, insert, update, delete on public.gift_ideas to authenticated;

create policy "Vlastník spravuje své lidi"
  on public.people for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Vlastník spravuje své nápady na dárky"
  on public.gift_ideas for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.people p where p.id = person_id and p.user_id = (select auth.uid()))
  );

alter table public.user_settings
  alter column pinned_modules set default array['piva', 'vdecnost', 'lide', 'meditace', 'hlaskomat'];
