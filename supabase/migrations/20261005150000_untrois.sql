-- 13 – Untrois: nápady na brand a vlastní významy čísla 13

create table public.untrois_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('napad', 'vyznam')),
  category text not null check (char_length(category) between 1 and 40),
  title text not null check (char_length(title) between 1 and 200),
  body text check (char_length(body) <= 4000),
  starred boolean not null default false,
  created_at timestamptz not null default now()
);

create index untrois_notes_user_created on public.untrois_notes (user_id, created_at desc);

alter table public.untrois_notes enable row level security;

grant select, insert, update, delete on public.untrois_notes to authenticated;

create policy "Vlastník spravuje své poznámky Untrois"
  on public.untrois_notes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
