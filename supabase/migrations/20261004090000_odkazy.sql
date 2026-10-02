-- Odkazy: uložené odkazy a obrázky, kolekce, ukládání ze Zkratky v iPhonu

create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- link = odkaz na web, image = nahraný obrázek / screenshot
  kind text not null default 'link' check (kind in ('link', 'image')),
  url text check (char_length(url) <= 2000),
  title text check (char_length(title) <= 300),
  description text check (char_length(description) <= 1000),
  image_url text check (char_length(image_url) <= 2000),
  site text check (char_length(site) <= 200),
  -- cesta k obrázku v úložišti (bucket links)
  storage_path text check (char_length(storage_path) <= 300),
  collection text check (char_length(collection) <= 60),
  note text check (char_length(note) <= 1000),
  preview_done boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (kind = 'image' or url is not null)
);

create index links_user_created on public.links (user_id, created_at desc);

alter table public.links enable row level security;

grant select, insert, update, delete on public.links to authenticated;

create policy "Vlastník spravuje své odkazy"
  on public.links for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Tajný klíč pro Zkratku „Uložit do appky“ (jde kdykoliv vyměnit v appce)
alter table public.user_settings
  add column share_token uuid not null default gen_random_uuid();

create unique index user_settings_share_token on public.user_settings (share_token);

-- Uložení odkazu ze Zkratky bez přihlášení: ověří se tajným klíčem, odkaz dostane vlastník klíče.
create or replace function public.save_link(p_token uuid, p_url text, p_title text default null, p_note text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_url text;
  v_id uuid;
begin
  select s.user_id into v_user from public.user_settings s where s.share_token = p_token;
  if v_user is null then
    raise exception 'Neplatný klíč' using errcode = '28000';
  end if;
  -- ze sdíleného textu („Koukni na tohle https://…“) vytáhne první odkaz
  v_url := substring(coalesce(p_url, '') from 'https?://[^\s<>"]+');
  if v_url is null or char_length(v_url) > 2000 then
    raise exception 'Ve sdíleném obsahu není odkaz' using errcode = '22023';
  end if;
  insert into public.links (user_id, kind, url, title, note)
  values (v_user, 'link', v_url, nullif(left(btrim(coalesce(p_title, '')), 300), ''), nullif(left(btrim(coalesce(p_note, '')), 1000), ''))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.save_link(uuid, text, text, text) from public;
grant execute on function public.save_link(uuid, text, text, text) to anon, authenticated;

-- Úložiště obrázků: soukromý bucket, každý vidí jen soubory ve složce se svým id
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('links', 'links', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Vlastník čte své obrázky odkazů"
  on storage.objects for select to authenticated
  using (bucket_id = 'links' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Vlastník nahrává své obrázky odkazů"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'links' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Vlastník maže své obrázky odkazů"
  on storage.objects for delete to authenticated
  using (bucket_id = 'links' and (storage.foldername(name))[1] = (select auth.uid())::text);
