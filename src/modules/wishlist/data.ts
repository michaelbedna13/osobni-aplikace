import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";

export type WishStatus = "chci" | "koupeno" | "nechci";

export interface Wish {
  id: string;
  title: string;
  url: string | null;
  image_url: string | null;
  site: string | null;
  price: number | null;
  priority: 1 | 2 | 3;
  status: WishStatus;
  /** Pravidlo 30 dní: do tohoto dne („2026-11-01“) se nekupuje. */
  wait_until: string | null;
  note: string | null;
  preview_done: boolean;
  closed_at: string | null;
  created_at: string;
}

export const PRIORITY_NAMES: Record<1 | 2 | 3, string> = { 1: "Až někdy", 2: "Chci", 3: "Moc chci" };

const store = createStore<Wish>("wishes", "created_at");
const KEY = ["wishes"];
const byNewest = (a: Wish, b: Wish) => b.created_at.localeCompare(a.created_at);

export const useWishes = () =>
  useQuery({
    queryKey: KEY,
    // Supabase vrací numeric jako text – převedeme na číslo
    queryFn: async () => (await store.list("1970-01-01T00:00:00.000Z")).map((w) => ({ ...w, price: w.price === null ? null : Number(w.price) })).sort(byNewest),
  });

function useWishMutation<V>(fn: (vars: V) => Promise<void>, apply: (list: Wish[], vars: V) => Wish[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<Wish[]>(KEY);
      queryClient.setQueryData<Wish[]>(KEY, (list = []) => apply(list, vars).sort(byNewest));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useAddWish = () => useWishMutation<Wish>((w) => store.insert(w), (list, w) => [...list, w]);
export const useUpdateWish = () =>
  useWishMutation<Wish>(({ id, created_at: _c, ...patch }) => store.update(id, patch), (list, w) => list.map((x) => (x.id === w.id ? w : x)));
export const useDeleteWish = () => useWishMutation<string>((id) => store.remove(id), (list, id) => list.filter((w) => w.id !== id));

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function newWish(fields: Partial<Wish> & Pick<Wish, "title">, wait30 = true, now = new Date()): Wish {
  const until = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
  return {
    id: crypto.randomUUID(), url: null, image_url: null, site: null, price: null, priority: 2, status: "chci",
    wait_until: wait30 ? dayKey(until) : null, note: null, preview_done: false, closed_at: null, created_at: now.toISOString(), ...fields,
  };
}

/** Kolik dní ještě počkat (0 = už můžeš koupit). */
export function daysToWait(w: Pick<Wish, "wait_until">, now = new Date()): number {
  if (!w.wait_until) return 0;
  const [y, m, d] = w.wait_until.split("-").map(Number);
  const diff = Math.ceil((new Date(y, m - 1, d).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
  return Math.max(0, diff);
}

export function closeWish(w: Wish, status: WishStatus, now = new Date()): Wish {
  return { ...w, status, closed_at: status === "chci" ? null : dayKey(now) };
}

export interface WishStats {
  open: number;
  openTotal: number;
  waiting: number;
  bought: number;
  boughtTotal: number;
  /** Ušetřeno: součet cen věcí, které už nechceš. */
  saved: number;
}

export function computeWishStats(list: Wish[], now = new Date()): WishStats {
  const sum = (ws: Wish[]) => ws.reduce((s, w) => s + (w.price ?? 0), 0);
  const open = list.filter((w) => w.status === "chci");
  const bought = list.filter((w) => w.status === "koupeno");
  return {
    open: open.length,
    openTotal: sum(open),
    waiting: open.filter((w) => daysToWait(w, now) > 0).length,
    bought: bought.length,
    boughtTotal: sum(bought),
    saved: sum(list.filter((w) => w.status === "nechci")),
  };
}

/** Pořadí přání: nejdřív priorita, pak co už nemusí čekat, pak nejnovější. */
export const sortWishes = (list: Wish[], now = new Date()) =>
  [...list].sort((a, b) => b.priority - a.priority || daysToWait(a, now) - daysToWait(b, now) || b.created_at.localeCompare(a.created_at));

export const formatKc = (n: number) => `${n.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`;

/** „1 299,90“ / „1299“ / „1 299 Kč“ → 1299.9 */
export function parsePrice(text: string): number | null {
  const clean = text.replace(/kč|czk|,-/gi, "").replace(/\s/g, "").replace(",", ".");
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}
