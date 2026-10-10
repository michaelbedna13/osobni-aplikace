// untrois-push: upozornění pro appku untrois (Web Push).
//
//   GET                       → { publicKey } veřejný klíč VAPID (pár se vytvoří při prvním volání a zůstane v databázi)
//   POST { "run": "cron" }    → pošle, co je zrovna na řadě (každou celou hodinu volá pg_cron, viz migrace upozorneni)
//   POST { "test": true }     → zkušební upozornění na zařízení přihlášeného uživatele (Authorization: Bearer <access token>)
//
// Nasazení: Supabase → Edge Functions → Deploy a new function → Via Editor, název untrois-push, vložit tento soubor,
// v nastavení funkce vypnout „Verify JWT“ (volá ji pg_cron bez přihlášení; každé upozornění odejde nejvýš jednou za den).
// Žádné tajné klíče se nezadávají: SUPABASE_URL a SUPABASE_SERVICE_ROLE_KEY dává Supabase funkcím sám.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const TZ = "Europe/Prague";
const APP_URL = "https://michaelbedna13.github.io/osobni-aplikace/";

type Kind = "narozeniny" | "platby" | "nakup" | "meditace" | "vdecnost" | "patek13";
type Prefs = Record<Kind, { on: boolean; hour: number }>;

// stejné výchozí hodiny jako v appce (src/lib/push.ts)
const DEFAULT_HOURS: Record<Kind, number> = { narozeniny: 8, nakup: 16, platby: 18, patek13: 19, meditace: 20, vdecnost: 21 };

interface Message {
  title: string;
  body: string;
  /** Cesta v appce (HashRouter), např. /m/nakup. */
  url: string;
}

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// ---------- klíče VAPID ----------

let vapid: { public_key: string; private_key: string } | null = null;

async function vapidKeys() {
  if (vapid) return vapid;
  const { data, error } = await db.from("push_vapid").select("public_key, private_key").eq("id", 1).maybeSingle();
  if (error) throw error;
  if (data) return (vapid = data);
  const keys = webpush.generateVAPIDKeys();
  // při souběžném prvním volání vyhraje první zápis, ostatní si ho přečtou
  await db.from("push_vapid").upsert({ id: 1, public_key: keys.publicKey, private_key: keys.privateKey }, { onConflict: "id", ignoreDuplicates: true });
  const again = await db.from("push_vapid").select("public_key, private_key").eq("id", 1).single();
  if (again.error) throw again.error;
  return (vapid = again.data);
}

// ---------- kalendář v Europe/Prague ----------

/** Kalendářní den jako UTC půlnoc (jen pro počítání dnů, ne pro čas). */
const cal = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const key = (d: Date) => d.toISOString().slice(0, 10);
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

function prague(at: Date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
      .formatToParts(at).map((x) => [x.type, x.value]),
  );
  return { day: cal(+p.year, +p.month, +p.day), hour: +p.hour };
}

/** Další obnova předplatného od `today` (včetně); konec měsíce drží jako appka (src/modules/finance/data.ts). */
function nextRenewal(next_date: string, period: string, today: Date): Date {
  const [y, m, d] = next_date.split("-").map(Number);
  let at = cal(y, m, d);
  for (let i = 1; at < today && i < 5000; i++) {
    if (period === "tyden") at = cal(y, m, d + 7 * i);
    else {
      const months = period === "mesic" ? i : 12 * i;
      const ny = y + Math.floor((m - 1 + months) / 12), nm = ((m - 1 + months) % 12) + 1;
      at = cal(ny, nm, Math.min(d, lastDay(ny, nm)));
    }
  }
  return at;
}

/** Slaví se tento den? 29. 2. v nepřestupném roce slaví 28. 2. */
function sameDay(month: number, day: number, on: Date) {
  const y = on.getUTCFullYear(), leap = lastDay(y, 2) === 29;
  const d = month === 2 && day === 29 && !leap ? 28 : day;
  return on.getUTCMonth() + 1 === month && on.getUTCDate() === d;
}

const kc = (n: number) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(Math.round(n))} Kč`;
const plural = (n: number, [one, few, many]: [string, string, string]) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);
const names = (list: string[]) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} a ${list[list.length - 1]}`);

// ---------- jednotlivá upozornění ----------

interface Ctx {
  userId: string;
  today: Date;
  tomorrow: Date;
}

async function birthdays({ userId, today, tomorrow }: Ctx): Promise<Message | null> {
  const { data: people } = await db.from("people").select("id, name, birth_day, birth_month, birth_year, nameday").eq("user_id", userId);
  if (!people?.length) return null;
  type P = (typeof people)[number];
  const born = (p: P, on: Date) => p.birth_month && p.birth_day && sameDay(p.birth_month, p.birth_day, on);
  const named = (p: P, on: Date) => p.nameday && sameDay(+p.nameday.slice(0, 2), +p.nameday.slice(3, 5), on);
  const age = (p: P, on: Date) => (p.birth_year ? ` (${on.getUTCFullYear() - p.birth_year})` : "");

  const bToday = people.filter((p) => born(p, today)), nToday = people.filter((p) => named(p, today) && !born(p, today));
  const bTomorrow = people.filter((p) => born(p, tomorrow)), nTomorrow = people.filter((p) => named(p, tomorrow) && !born(p, tomorrow));
  const lines: string[] = [];
  if (bToday.length) lines.push(`Dnes slaví ${names(bToday.map((p) => p.name + age(p, today)))}`);
  if (nToday.length) lines.push(`Svátek má ${names(nToday.map((p) => p.name))}`);
  if (bTomorrow.length) lines.push(`Zítra narozeniny: ${names(bTomorrow.map((p) => p.name + age(p, tomorrow)))}`);
  if (nTomorrow.length) lines.push(`Zítra svátek: ${names(nTomorrow.map((p) => p.name))}`);
  if (!lines.length) return null;

  // nápady na dárek (ještě nedané) pro ty, kdo slaví narozeniny dnes nebo zítra
  const celebrating = [...bToday, ...bTomorrow];
  if (celebrating.length) {
    const { data: ideas } = await db.from("gift_ideas").select("person_id, text").eq("user_id", userId).is("given_at", null)
      .in("person_id", celebrating.map((p) => p.id));
    for (const p of celebrating) {
      const mine = (ideas ?? []).filter((i) => i.person_id === p.id).map((i) => i.text);
      if (mine.length) lines.push(`🎁 ${p.name}: ${mine.slice(0, 3).join(", ")}${mine.length > 3 ? "…" : ""}`);
    }
  }
  const all = [...bToday, ...nToday, ...bTomorrow, ...nTomorrow];
  const [title, ...rest] = lines;
  return { title: `${bToday.length ? "🎂" : "🎈"} ${title}`, body: rest.join("\n"), url: all.length === 1 ? `/m/lide/${all[0].id}` : "/m/lide" };
}

async function payments({ userId, today, tomorrow }: Ctx): Promise<Message | null> {
  const [{ data: exps }, { data: subs }] = await Promise.all([
    db.from("expenses").select("name, amount, period, due_day").eq("user_id", userId).eq("active", true).eq("period", "mesic").not("due_day", "is", null),
    db.from("subscriptions").select("name, price, period, next_date").eq("user_id", userId).eq("active", true),
  ]);
  const y = tomorrow.getUTCFullYear(), m = tomorrow.getUTCMonth() + 1, d = tomorrow.getUTCDate();
  const due = (exps ?? []).filter((e) => Math.min(e.due_day, lastDay(y, m)) === d).map((e) => ({ name: e.name, amount: Number(e.amount), sub: false }));
  const renew = (subs ?? []).filter((s) => key(nextRenewal(s.next_date, s.period, today)) === key(tomorrow)).map((s) => ({ name: s.name, amount: Number(s.price), sub: true }));
  const all = [...due, ...renew].sort((a, b) => b.amount - a.amount);
  if (!all.length) return null;
  const total = all.reduce((s, p) => s + p.amount, 0);
  return {
    title: `💸 Zítra se platí ${kc(total)}`,
    body: all.map((p) => `${p.name} ${kc(p.amount)}${p.sub ? " · obnova předplatného" : ""}`).join("\n"),
    url: "/m/finance",
  };
}

async function shopping({ userId }: Ctx): Promise<Message | null> {
  const { data } = await db.from("shopping_items").select("name, qty").eq("user_id", userId).eq("done", false).eq("archived", false)
    .order("created_at", { ascending: true });
  if (!data?.length) return null;
  const n = data.length;
  return {
    title: `🛒 Na nákupním seznamu ${plural(n, ["je", "jsou", "je"])} ${n} ${plural(n, ["položka", "položky", "položek"])}`,
    body: data.slice(0, 5).map((i) => (i.qty ? `${i.name} (${i.qty})` : i.name)).join(", ") + (n > 5 ? "…" : ""),
    url: "/m/nakup",
  };
}

async function meditation({ userId, today }: Ctx): Promise<Message | null> {
  const since = new Date(Date.now() - 36 * 3_600_000).toISOString();
  const { data } = await db.from("meditations").select("started_at").eq("user_id", userId).gte("started_at", since);
  if ((data ?? []).some((r) => key(prague(new Date(r.started_at)).day) === key(today))) return null;
  return { title: "🧘 Dnes ještě žádná meditace", body: "Stačí pár minut. Ťukni a začni.", url: "/m/meditace" };
}

async function gratitude({ userId, today }: Ctx): Promise<Message | null> {
  const { count } = await db.from("gratitude").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("day", key(today));
  if (count) return null;
  return { title: "🙏 Za co jsi dnes vděčný?", body: "Stačí jedna věta.", url: "/m/vdecnost" };
}

function friday13({ tomorrow }: Ctx): Message | null {
  if (tomorrow.getUTCDay() !== 5 || tomorrow.getUTCDate() !== 13) return null;
  return { title: "1️⃣3️⃣ Zítra je pátek 13.", body: "Pro untrois šťastný den.", url: "/" };
}

const BUILDERS: Record<Kind, (ctx: Ctx) => Promise<Message | null> | Message | null> = {
  narozeniny: birthdays, platby: payments, nakup: shopping, meditace: meditation, vdecnost: gratitude, patek13: friday13,
};

// ---------- odeslání ----------

interface Sub {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** Pošle zprávu na všechna zařízení; zaniklé odběry (404/410) smaže. Vrací počet doručených.
 *  web-push jen zašifruje a podepíše, odesílá nativní fetch. */
async function deliver(subs: Sub[], message: Message, tag: string): Promise<number> {
  const keys = await vapidKeys();
  const payload = JSON.stringify({ ...message, tag });
  const results = await Promise.all(subs.map(async (s) => {
    try {
      const req = webpush.generateRequestDetails({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
        TTL: 6 * 3600,
        urgency: "normal",
        vapidDetails: { subject: APP_URL, publicKey: keys.public_key, privateKey: keys.private_key },
      });
      const res = await fetch(req.endpoint, { method: req.method, headers: req.headers, body: req.body });
      if (res.ok) return 1;
      if (res.status === 404 || res.status === 410) await db.from("push_subscriptions").delete().eq("id", s.id);
      else console.error("push", res.status, await res.text());
    } catch (e) {
      console.error("push", (e as Error).message);
    }
    return 0;
  }));
  return results.reduce<number>((a, b) => a + b, 0);
}

function normalizePrefs(raw: unknown): Prefs {
  const src = raw && typeof raw === "object" ? (raw as Record<string, { on?: unknown; hour?: unknown }>) : {};
  return Object.fromEntries((Object.keys(DEFAULT_HOURS) as Kind[]).map((k) => {
    const p = src[k];
    return [k, {
      on: typeof p?.on === "boolean" ? p.on : true,
      hour: typeof p?.hour === "number" && p.hour >= 0 && p.hour <= 23 ? p.hour : DEFAULT_HOURS[k],
    }];
  })) as Prefs;
}

async function runCron(now = new Date()) {
  const { day: today, hour } = prague(now);
  const tomorrow = addDays(today, 1);
  const { data: subs, error } = await db.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth");
  if (error) throw error;
  const byUser = new Map<string, Sub[]>();
  for (const s of subs ?? []) byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s]);

  let sent = 0;
  for (const [userId, devices] of byUser) {
    const { data: settings } = await db.from("user_settings").select("notification_prefs").eq("user_id", userId).maybeSingle();
    const prefs = normalizePrefs(settings?.notification_prefs);
    const ctx: Ctx = { userId, today, tomorrow };
    for (const kind of Object.keys(BUILDERS) as Kind[]) {
      const p = prefs[kind];
      // ve svou hodinu, nebo hodinu potom, kdyby jedno spuštění vypadlo
      if (!p.on || hour < p.hour || hour > p.hour + 1) continue;
      const message = await BUILDERS[kind](ctx);
      if (!message) continue;
      // zápis do deníku = zámek, ať stejné upozornění nepřijde dvakrát
      const { error: dup } = await db.from("notification_log").insert({ user_id: userId, kind, day: key(today) });
      if (dup) continue;
      sent += await deliver(devices, message, `${kind}-${key(today)}`);
    }
  }
  return sent;
}

async function runTest(req: Request) {
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "chybí přihlášení" }, 401);
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return json({ error: "neplatné přihlášení" }, 401);
  const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", user.id);
  const sent = await deliver(subs ?? [], { title: "Zkušební upozornění 🎉", body: "Funguje to. Takhle budou chodit připomínky.", url: "/profil" }, "test");
  return json({ sent });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (req.method === "GET") return json({ publicKey: (await vapidKeys()).public_key });
    if (req.method !== "POST") return json({ error: "metoda" }, 405);
    const body = await req.json().catch(() => ({}));
    if (body?.test) return await runTest(req);
    return json({ sent: await runCron() });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
