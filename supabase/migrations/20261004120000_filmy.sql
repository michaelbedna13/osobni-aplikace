-- Filmy, seriály a knihy: chci vidět / přečíst, rozkoukáno, hotovo, hodnocení

create table public.media_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('film', 'serial', 'kniha')),
  title text not null check (char_length(title) between 1 and 300),
  year smallint check (year between 1000 and 2100),
  -- režisér / autor / stanice
  creator text check (char_length(creator) <= 200),
  image_url text check (char_length(image_url) <= 2000),
  external_url text check (char_length(external_url) <= 2000),
  -- odkud je záznam: itunes, tvmaze, openlibrary, rucne
  source text not null default 'rucne' check (char_length(source) <= 20),
  source_id text check (char_length(source_id) <= 100),
  status text not null default 'chci' check (status in ('chci', 'ted', 'hotovo', 'vzdano')),
  rating smallint check (rating between 1 and 5),
  recommended_by text check (char_length(recommended_by) <= 80),
  note text check (char_length(note) <= 1000),
  finished_at date,
  created_at timestamptz not null default now()
);

create index media_items_user_created on public.media_items (user_id, created_at desc);

alter table public.media_items enable row level security;

grant select, insert, update, delete on public.media_items to authenticated;

create policy "Vlastník spravuje své filmy a knihy"
  on public.media_items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter table public.user_settings
  add column reading_goal integer not null default 12 check (reading_goal between 1 and 365);
