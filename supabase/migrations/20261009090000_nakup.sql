-- Nákupní seznam: položky po odděleních obchodu, koupené zůstávají jako historie pro návrhy

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  qty text check (char_length(qty) <= 30),
  category text not null check (char_length(category) between 1 and 40),
  -- odškrtnuto (v košíku)
  done boolean not null default false,
  done_at timestamptz,
  -- vyčištěno ze seznamu, zůstává jen v historii
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists shopping_items_user_created on public.shopping_items (user_id, created_at desc);

alter table public.shopping_items enable row level security;

grant select, insert, update, delete on public.shopping_items to authenticated;

drop policy if exists "Vlastník spravuje svůj nákupní seznam" on public.shopping_items;
create policy "Vlastník spravuje svůj nákupní seznam"
  on public.shopping_items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
