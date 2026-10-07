-- 13 – Untrois: nápady jako nástěnka (fotka, odkaz s náhledem, text)

alter table public.untrois_notes
  add column url text check (char_length(url) <= 2000),
  add column image_url text check (char_length(image_url) <= 2000),
  add column site text check (char_length(site) <= 200),
  -- cesta k fotce v úložišti (bucket untrois)
  add column storage_path text check (char_length(storage_path) <= 300);

-- nápad může být jen fotka nebo jen odkaz, popisek je nepovinný
alter table public.untrois_notes alter column title drop not null;
alter table public.untrois_notes
  add constraint untrois_notes_has_content check (title is not null or url is not null or storage_path is not null or image_url is not null);

-- Úložiště fotek: soukromý bucket, každý vidí jen soubory ve složce se svým id
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('untrois', 'untrois', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Vlastník čte své fotky Untrois"
  on storage.objects for select to authenticated
  using (bucket_id = 'untrois' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Vlastník nahrává své fotky Untrois"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'untrois' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Vlastník maže své fotky Untrois"
  on storage.objects for delete to authenticated
  using (bucket_id = 'untrois' and (storage.foldername(name))[1] = (select auth.uid())::text);
