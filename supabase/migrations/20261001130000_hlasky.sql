-- Hláškomat

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null check (length(trim(text)) > 0),
  author text,
  context text,
  said_at timestamptz not null default now(),
  starred boolean not null default false,
  created_at timestamptz not null default now()
);

create index quotes_user_said_at on public.quotes (user_id, said_at desc);

alter table public.quotes enable row level security;

grant select, insert, update, delete on public.quotes to authenticated;

create policy "Vlastník spravuje své hlášky"
  on public.quotes for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
