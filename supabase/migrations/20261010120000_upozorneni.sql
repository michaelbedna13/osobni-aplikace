-- Upozornění (Web Push): odběry zařízení, nastavení, deník odeslaných a hodinové spouštění funkce untrois-push.
-- Spusť celé v SQL Editoru. Funkci untrois-push je potřeba nasadit zvlášť (supabase/functions/untrois-push).

-- Odběr jednoho zařízení (prohlížeče). Jeden uživatel může mít víc zařízení.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique check (char_length(endpoint) <= 2000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  user_agent text check (char_length(user_agent) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

grant select, insert, update, delete on public.push_subscriptions to authenticated;

drop policy if exists "Vlastník spravuje své odběry upozornění" on public.push_subscriptions;
create policy "Vlastník spravuje své odběry upozornění"
  on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Co a kdy posílat: { "narozeniny": { "on": true, "hour": 8 }, … }. Chybějící druh = zapnutý s výchozí hodinou.
alter table public.user_settings
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb;

-- Odeslaná upozornění, aby žádné nepřišlo dvakrát za den. Jen pro funkci (service role), appka sem nevidí.
create table if not exists public.notification_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  day date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, day)
);

alter table public.notification_log enable row level security;

-- Pár klíčů VAPID. Vytvoří ho funkce sama při prvním volání; soukromý klíč nikdy neopustí databázi.
-- Bez policy a bez grantů: číst ho může jen service role (funkce).
create table if not exists public.push_vapid (
  id smallint primary key default 1 check (id = 1),
  public_key text not null,
  private_key text not null,
  created_at timestamptz not null default now()
);

alter table public.push_vapid enable row level security;

-- Hodinové spouštění: pg_cron v každou celou hodinu zavolá funkci, ta si sama pohlídá hodiny v Europe/Prague.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid) from cron.job where jobname = 'untrois-upozorneni';

select cron.schedule(
  'untrois-upozorneni',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://nvjyxwsyrcslaruvqkkm.supabase.co/functions/v1/untrois-push',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"run": "cron"}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
