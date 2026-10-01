-- Fáze 0: společný základ
-- Každá tabulka s osobními daty má user_id a Row Level Security: data vidí jen jejich vlastník.

-- Pomocná funkce pro automatické updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Nastavení uživatele (zatím: moduly připnuté na obrazovce Dnes)
create table public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  pinned_modules text[] not null default array['piva', 'meditace', 'trenink', 'hlaskomat', 'denik'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

alter table public.user_settings enable row level security;

create policy "Vlastník čte svá nastavení"
  on public.user_settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Vlastník vkládá svá nastavení"
  on public.user_settings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Vlastník upravuje svá nastavení"
  on public.user_settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
