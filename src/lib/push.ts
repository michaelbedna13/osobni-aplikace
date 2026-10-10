import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import { useAuth } from "./auth";

// Upozornění (Web Push). Na iPhonu fungují od iOS 16.4 a jen v appce přidané na plochu.
// Odběr zařízení je v tabulce push_subscriptions, co a kdy posílat v user_settings.notification_prefs.
// Posílá je funkce Supabase untrois-push (supabase/functions/untrois-push), kterou každou hodinu spustí pg_cron.

export type NotifyKind = "narozeniny" | "platby" | "nakup" | "meditace" | "vdecnost" | "patek13";

export interface NotifyType {
  key: NotifyKind;
  name: string;
  hint: string;
  /** Výchozí hodina (Europe/Prague). */
  hour: number;
}

/** Druhy upozornění v pořadí podle denní doby. Výchozí hodiny drží i funkce untrois-push. */
export const NOTIFY_TYPES: NotifyType[] = [
  { key: "narozeniny", name: "Narozeniny a svátky", hint: "Kdo dnes a zítra slaví, s nápady na dárek", hour: 8 },
  { key: "nakup", name: "Nákup", hint: "Když je něco na nákupním seznamu", hour: 16 },
  { key: "platby", name: "Platby", hint: "Den předem, výdaje i předplatné", hour: 18 },
  { key: "patek13", name: "Pátek 13.", hint: "Den předem", hour: 19 },
  { key: "meditace", name: "Meditace", hint: "Když dnes ještě nebyla", hour: 20 },
  { key: "vdecnost", name: "Vděčnost", hint: "Když dnes chybí zápis", hour: 21 },
];

export type NotifyPrefs = Record<NotifyKind, { on: boolean; hour: number }>;

export const DEFAULT_PREFS = Object.fromEntries(NOTIFY_TYPES.map((t) => [t.key, { on: true, hour: t.hour }])) as NotifyPrefs;

export function normalizePrefs(raw: unknown): NotifyPrefs {
  const src = raw && typeof raw === "object" ? (raw as Record<string, { on?: unknown; hour?: unknown }>) : {};
  const out = { ...DEFAULT_PREFS };
  for (const t of NOTIFY_TYPES) {
    const p = src[t.key];
    out[t.key] = {
      on: typeof p?.on === "boolean" ? p.on : true,
      hour: typeof p?.hour === "number" && Number.isInteger(p.hour) && p.hour >= 0 && p.hour <= 23 ? p.hour : t.hour,
    };
  }
  return out;
}

const FUNCTION_URL = `${(import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ""}/functions/v1/untrois-push`;

/** Prohlížeč umí push (service worker + Push API + oznámení). */
export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

/** Appka běží z plochy (na iPhonu jediný režim, kde push funguje). */
export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

/** Service worker, nejdéle 5 s (ve vývojovém režimu žádný není). */
async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSupported()) return null;
  return Promise.race([navigator.serviceWorker.ready, new Promise<null>((r) => setTimeout(() => r(null), 5000))]);
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const b64 = (value + "=".repeat((4 - (value.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Chyba z funkce i s její zprávou (funkce vrací { error }), ať je z Profilu vidět, co přesně selhalo. */
async function functionError(res: Response) {
  const detail = await res.json().then((b: { error?: string }) => b.error).catch(() => undefined);
  return new Error(`untrois-push ${res.status}${detail ? `: ${detail}` : ""}`);
}

const bytesToBase64Url = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/** Veřejný klíč VAPID: funkce untrois-push si pár klíčů vytvoří sama při prvním volání, soukromý nikdy neopustí databázi. */
async function publicKey(): Promise<string> {
  const res = await fetch(FUNCTION_URL);
  if (!res.ok) throw await functionError(res);
  const { publicKey } = (await res.json()) as { publicKey?: string };
  if (!publicKey) throw new Error("chybí veřejný klíč");
  return publicKey;
}

export type DeviceState = "unsupported" | "install" | "denied" | "off" | "on";

async function deviceState(): Promise<DeviceState> {
  if (!pushSupported()) return isStandalone() ? "unsupported" : "install";
  if (Notification.permission === "denied") return "denied";
  const reg = await registration();
  if (!reg) return "unsupported";
  const sub = await reg.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "on" : "off";
}

/** Stav upozornění na tomhle zařízení a jejich zapnutí / vypnutí. */
export function usePushDevice() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["push-device"];
  const state = useQuery({ queryKey, queryFn: deviceState, staleTime: Infinity });

  const enable = useMutation({
    // musí běžet z ťuknutí (iOS se jinak nezeptá)
    mutationFn: async () => {
      if (!supabase || !session) throw new Error("Upozornění potřebují přihlášení.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;
      const reg = await registration();
      if (!reg) throw new Error("Service worker neběží.");
      const key = await publicKey();
      let sub = await reg.pushManager.getSubscription();
      // starý odběr s jiným klíčem by funkce nemohla použít
      const current = sub?.options.applicationServerKey;
      if (sub && current && bytesToBase64Url(current) !== key) {
        await sub.unsubscribe();
        sub = null;
      }
      sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(key) });
      const json = sub.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert(
        { user_id: session.user.id, endpoint: sub.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth, user_agent: navigator.userAgent.slice(0, 300) },
        { onConflict: "endpoint" },
      );
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const disable = useMutation({
    mutationFn: async () => {
      const reg = await registration();
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) return;
      if (supabase) await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const test = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("Upozornění potřebují přihlášení.");
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ test: true }),
      });
      if (!res.ok) throw await functionError(res);
      const { sent } = (await res.json()) as { sent?: number };
      if (!sent) throw new Error("Nepodařilo se doručit na žádné zařízení.");
    },
  });

  return { state: state.data, loading: state.isPending, enable, disable, test };
}

/** Co a kdy posílat (stejné pro všechna zařízení). Vlastní dotaz, ať zbytek nastavení nezávisí na sloupci notification_prefs. */
export function useNotifyPrefs() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const queryKey = ["notify-prefs", userId ?? "local"];

  const query = useQuery({
    queryKey,
    enabled: Boolean(supabase && userId),
    queryFn: async (): Promise<NotifyPrefs> => {
      const { data, error } = await supabase!.from("user_settings").select("notification_prefs").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return normalizePrefs(data?.notification_prefs);
    },
  });

  const prefs = query.data ?? DEFAULT_PREFS;

  const mutation = useMutation({
    mutationFn: async (next: NotifyPrefs) => {
      if (!supabase || !userId) return;
      const { error } = await supabase.from("user_settings").upsert({ user_id: userId, notification_prefs: next });
      if (error) throw error;
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NotifyPrefs>(queryKey);
      queryClient.setQueryData(queryKey, next);
      return { previous };
    },
    onError: (_error, _next, context) => queryClient.setQueryData(queryKey, context?.previous),
  });

  return {
    prefs,
    set: (kind: NotifyKind, patch: Partial<NotifyPrefs[NotifyKind]>) => mutation.mutate({ ...prefs, [kind]: { ...prefs[kind], ...patch } }),
    error: query.error ?? mutation.error,
  };
}

/** Po otevření appky smaže odznak na ikoně (počítadlo vede service worker v public/push-sw.js). */
export function useClearBadge() {
  useEffect(() => {
    const nav = navigator as Navigator & { clearAppBadge?: () => Promise<void> };
    if (!nav.clearAppBadge) return;
    const clear = () => {
      if (document.visibilityState !== "visible") return;
      nav.clearAppBadge?.().catch(() => {});
      caches?.open("untrois-badge").then((c) => c.put("count", new Response("0"))).catch(() => {});
    };
    clear();
    document.addEventListener("visibilitychange", clear);
    return () => document.removeEventListener("visibilitychange", clear);
  }, []);
}
