-- Vděčnost: „Za co jsem dnes vděčný?“ – víc krátkých zápisů za den

create table public.gratitude (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null default current_date,
  text text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);

create index gratitude_user_day on public.gratitude (user_id, day desc);

alter table public.gratitude enable row level security;

grant select, insert, update, delete on public.gratitude to authenticated;

create policy "Vlastník spravuje své zápisy vděčnosti"
  on public.gratitude for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Modul Deník se přejmenoval na Vděčnost
alter table public.user_settings
  alter column pinned_modules set default array['piva', 'vdecnost', 'meditace', 'hlaskomat', 'trenink'];

update public.user_settings
  set pinned_modules = array_replace(pinned_modules, 'denik', 'vdecnost')
  where 'denik' = any (pinned_modules);
