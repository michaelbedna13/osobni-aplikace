import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { addDays, startOfDay, startOfMonth, startOfWeek } from "../../lib/dates";

export interface Gratitude {
  id: string;
  /** Den zápisu v místním čase, „2026-10-02“. */
  day: string;
  text: string;
  created_at: string;
}

const store = createStore<Gratitude>("gratitude", "day");
const QUERY_KEY = ["gratitude"];

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromDayKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const byNewest = (a: Gratitude, b: Gratitude) => b.day.localeCompare(a.day) || b.created_at.localeCompare(a.created_at);

export function newGratitude(text: string, now = new Date()): Gratitude {
  return { id: crypto.randomUUID(), day: dayKey(now), text: text.trim(), created_at: now.toISOString() };
}

export function useGratitude() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: async () => (await store.list("1970-01-01")).sort(byNewest) });
}

function useGratitudeMutation<V>(fn: (vars: V) => Promise<void>, apply: (list: Gratitude[], vars: V) => Gratitude[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Gratitude[]>(QUERY_KEY);
      queryClient.setQueryData<Gratitude[]>(QUERY_KEY, (list = []) => apply(list, vars).sort(byNewest));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(QUERY_KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export const useAddGratitude = () => useGratitudeMutation<Gratitude>((g) => store.insert(g), (list, g) => [...list, g]);
export const useUpdateGratitude = () =>
  useGratitudeMutation<Gratitude>(({ id, text }) => store.update(id, { text }), (list, g) => list.map((x) => (x.id === g.id ? g : x)));
export const useDeleteGratitude = () => useGratitudeMutation<string>((id) => store.remove(id), (list, id) => list.filter((g) => g.id !== id));

export interface GratitudeStats {
  today: Gratitude[];
  /** Dní v řadě se zápisem. Dnešek se počítá, jen když už je zapsaný; jinak série trvá od včerejška. */
  streak: number;
  bestStreak: number;
  weekDays: number;
  monthCount: number;
  total: number;
  totalDays: number;
  /** Počet zápisů po dnech za posledních `weeks` týdnů, po týdnech (Po–Ne); budoucí dny jsou null. */
  mosaic: (number | null)[][];
  /** Zápisy z tohoto dne před rokem. */
  yearAgo: Gratitude[];
  /** Starší zápis na připomenutí (stejný po celý den). */
  memory: Gratitude | null;
}

export function computeGratitudeStats(list: Gratitude[], now = new Date(), weeks = 12): GratitudeStats {
  const todayKey = dayKey(now);
  const perDay = new Map<string, number>();
  for (const g of list) {
    if (g.day > todayKey) continue;
    perDay.set(g.day, (perDay.get(g.day) ?? 0) + 1);
  }
  const has = (d: Date) => perDay.has(dayKey(d));
  const today = startOfDay(now);

  let streak = 0;
  for (let d = has(today) ? today : addDays(today, -1); has(d); d = addDays(d, -1)) streak++;

  let bestStreak = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of [...perDay.keys()].sort()) {
    const d = fromDayKey(key);
    run = prev && dayKey(addDays(prev, 1)) === key ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    prev = d;
  }

  const weekStart = startOfWeek(now);
  const monthKey = dayKey(startOfMonth(now));
  const past = list.filter((g) => g.day <= todayKey);
  const older = past.filter((g) => g.day < dayKey(addDays(today, -30)));
  const seed = Math.floor(today.getTime() / 86_400_000);
  const yearAgoKey = dayKey(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));

  return {
    today: past.filter((g) => g.day === todayKey),
    streak,
    bestStreak,
    weekDays: Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).filter((d) => d <= today && has(d)).length,
    monthCount: past.filter((g) => g.day >= monthKey).length,
    total: past.length,
    totalDays: perDay.size,
    mosaic: Array.from({ length: weeks }, (_, w) =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(weekStart, 7 * (w - weeks + 1) + i);
        return d > today ? null : perDay.get(dayKey(d)) ?? 0;
      })),
    yearAgo: past.filter((g) => g.day === yearAgoKey),
    memory: older.length ? older[seed % older.length] : null,
  };
}
