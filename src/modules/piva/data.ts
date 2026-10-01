import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { addDays, startOfDay, startOfMonth, startOfWeek, startOfYear } from "../../lib/dates";

/** Jeden vypitý půllitr. */
export interface Beer {
  id: string;
  drunk_at: string;
}

const store = createStore<Beer>("beers", "drunk_at");
const QUERY_KEY = ["beers"];
const ALL_TIME = "1970-01-01T00:00:00.000Z";

export function useBeers() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: () => store.list(ALL_TIME) });
}

function useBeerMutation<V>(fn: (vars: V) => Promise<void>, apply: (beers: Beer[], vars: V) => Beer[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Beer[]>(QUERY_KEY);
      queryClient.setQueryData<Beer[]>(QUERY_KEY, (beers = []) =>
        apply(beers, vars).sort((a, b) => b.drunk_at.localeCompare(a.drunk_at)));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(QUERY_KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export const useAddBeer = () => useBeerMutation<Beer>((beer) => store.insert(beer), (beers, beer) => [...beers, beer]);

export const useUpdateBeer = () =>
  useBeerMutation<Beer>(
    ({ id, drunk_at }) => store.update(id, { drunk_at }),
    (beers, beer) => beers.map((b) => (b.id === beer.id ? beer : b)),
  );

export const useDeleteBeer = () => useBeerMutation<string>((id) => store.remove(id), (beers, id) => beers.filter((b) => b.id !== id));

export const newBeer = (when = new Date()): Beer => ({ id: crypto.randomUUID(), drunk_at: when.toISOString() });

export interface BeerStats {
  today: number;
  week: number;
  month: number;
  year: number;
  total: number;
  /** Počty po dnech tohoto týdne (Po–Ne); budoucí dny jsou null. */
  thisWeek: (number | null)[];
  todayIndex: number;
  /** Posledních 12 týdnů od nejstaršího; poslední je tento týden. */
  lastWeeks: { start: Date; count: number }[];
  /** Podle dne v týdnu (Po–Ne): celkem a průměr na jeden takový den. */
  byWeekday: { total: number; average: number }[];
  perDay: number;
  perWeek: number;
  bestDay: { date: Date; count: number } | null;
  bestWeek: { start: Date; count: number } | null;
  firstDate: Date | null;
}

const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;
const dayKey = (d: Date) => startOfDay(d).getTime();

export function computeStats(beers: Beer[], now = new Date()): BeerStats {
  const todayStart = startOfDay(now);
  const tomorrow = addDays(todayStart, 1).getTime();
  const weekStart = startOfWeek(now);
  const month = startOfMonth(now).getTime();
  const year = startOfYear(now).getTime();
  const todayIndex = weekdayIndex(now);

  const perDayMap = new Map<number, number>();
  const perWeekMap = new Map<number, number>();
  let first: number | null = null;
  const s = { today: 0, week: 0, month: 0, year: 0, total: 0 };

  for (const b of beers) {
    const date = new Date(b.drunk_at);
    const t = date.getTime();
    if (Number.isNaN(t) || t >= tomorrow) continue;
    s.total++;
    if (t >= todayStart.getTime()) s.today++;
    if (t >= weekStart.getTime()) s.week++;
    if (t >= month) s.month++;
    if (t >= year) s.year++;
    const day = dayKey(date);
    perDayMap.set(day, (perDayMap.get(day) ?? 0) + 1);
    const week = startOfWeek(date).getTime();
    perWeekMap.set(week, (perWeekMap.get(week) ?? 0) + 1);
    if (first === null || day < first) first = day;
  }

  const thisWeek = Array.from({ length: 7 }, (_, i) =>
    i <= todayIndex ? perDayMap.get(dayKey(addDays(weekStart, i))) ?? 0 : null);

  const lastWeeks = Array.from({ length: 12 }, (_, i) => {
    const start = addDays(weekStart, -7 * (11 - i));
    return { start, count: perWeekMap.get(start.getTime()) ?? 0 };
  });

  // Kolikrát který den v týdnu nastal od prvního záznamu do dneška
  const occurrences = Array(7).fill(0) as number[];
  const totals = Array(7).fill(0) as number[];
  let days = 0;
  if (first !== null) {
    for (let d = new Date(first); d.getTime() <= todayStart.getTime(); d = addDays(d, 1)) {
      occurrences[weekdayIndex(d)]++;
      days++;
    }
    for (const [day, count] of perDayMap) totals[weekdayIndex(new Date(day))] += count;
  }

  let bestDay: BeerStats["bestDay"] = null;
  for (const [day, count] of perDayMap) if (!bestDay || count > bestDay.count) bestDay = { date: new Date(day), count };
  let bestWeek: BeerStats["bestWeek"] = null;
  for (const [week, count] of perWeekMap) if (!bestWeek || count > bestWeek.count) bestWeek = { start: new Date(week), count };

  return {
    ...s,
    thisWeek,
    todayIndex,
    lastWeeks,
    byWeekday: totals.map((total, i) => ({ total, average: occurrences[i] ? total / occurrences[i] : 0 })),
    perDay: days ? s.total / days : 0,
    perWeek: days ? (s.total / days) * 7 : 0,
    bestDay,
    bestWeek,
    firstDate: first === null ? null : new Date(first),
  };
}
