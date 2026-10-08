import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { addDays, startOfDay, startOfMonth, startOfWeek } from "../../lib/dates";

export interface Meditation {
  id: string;
  started_at: string;
  duration_s: number;
  note: string | null;
}

const store = createStore<Meditation>("meditations", "started_at");
const QUERY_KEY = ["meditations"];

export function useMeditations() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: () => store.list("1970-01-01T00:00:00.000Z") });
}

function useMeditationMutation<V>(fn: (vars: V) => Promise<void>, apply: (list: Meditation[], vars: V) => Meditation[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Meditation[]>(QUERY_KEY);
      queryClient.setQueryData<Meditation[]>(QUERY_KEY, (list = []) =>
        apply(list, vars).sort((a, b) => b.started_at.localeCompare(a.started_at)));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(QUERY_KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export const useAddMeditation = () => useMeditationMutation<Meditation>((m) => store.insert(m), (list, m) => [...list, m]);
export const useUpdateMeditation = () =>
  useMeditationMutation<Meditation>(({ id, ...patch }) => store.update(id, patch), (list, m) => list.map((x) => (x.id === m.id ? m : x)));
export const useDeleteMeditation = () => useMeditationMutation<string>((id) => store.remove(id), (list, id) => list.filter((m) => m.id !== id));

/** „15 min“, „1 h 5 min“; pod minutu „45 s“. */
export function formatDuration(seconds: number) {
  if (seconds === 0) return "0 min";
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export interface MeditationStats {
  /** Počet meditací tento týden. */
  weekCount: number;
  /** Počet dní s meditací tento týden – podle nich se plní cíl. */
  weekDays: number;
  weekMinutes: number;
  /** Minuty po dnech tohoto týdne (Po–Ne); budoucí dny jsou null. */
  thisWeek: (number | null)[];
  todayIndex: number;
  monthMinutes: number;
  totalMinutes: number;
  totalCount: number;
  averageMinutes: number;
  longest: Meditation | null;
  /** Počet týdnů v řadě se splněným cílem (dní s meditací; tento týden se počítá, jen když už je splněný). */
  weekStreak: number;
  lastWeeks: { start: Date; minutes: number; count: number }[];
}

export function computeMeditationStats(list: Meditation[], goal: number, now = new Date()): MeditationStats {
  const tomorrow = addDays(startOfDay(now), 1).getTime();
  const weekStart = startOfWeek(now);
  const month = startOfMonth(now).getTime();
  const todayIndex = (now.getDay() + 6) % 7;

  const perWeek = new Map<number, { minutes: number; count: number; days: Set<number> }>();
  const perDay = new Map<number, number>();
  const stats: MeditationStats = {
    weekCount: 0, weekDays: 0, weekMinutes: 0, thisWeek: [], todayIndex, monthMinutes: 0, totalMinutes: 0, totalCount: 0,
    averageMinutes: 0, longest: null, weekStreak: 0, lastWeeks: [],
  };

  for (const m of list) {
    const date = new Date(m.started_at);
    const t = date.getTime();
    if (Number.isNaN(t) || t >= tomorrow) continue;
    const minutes = m.duration_s / 60;
    stats.totalCount++;
    stats.totalMinutes += minutes;
    if (t >= weekStart.getTime()) {
      stats.weekCount++;
      stats.weekMinutes += minutes;
    }
    if (t >= month) stats.monthMinutes += minutes;
    if (!stats.longest || m.duration_s > stats.longest.duration_s) stats.longest = m;
    const day = startOfDay(date).getTime();
    perDay.set(day, (perDay.get(day) ?? 0) + minutes);
    const week = startOfWeek(date).getTime();
    const w = perWeek.get(week) ?? { minutes: 0, count: 0, days: new Set<number>() };
    w.days.add(day);
    perWeek.set(week, { minutes: w.minutes + minutes, count: w.count + 1, days: w.days });
  }

  stats.averageMinutes = stats.totalCount ? stats.totalMinutes / stats.totalCount : 0;
  stats.thisWeek = Array.from({ length: 7 }, (_, i) =>
    i <= todayIndex ? Math.round(perDay.get(addDays(weekStart, i).getTime()) ?? 0) : null);
  stats.lastWeeks = Array.from({ length: 12 }, (_, i) => {
    const start = addDays(weekStart, -7 * (11 - i));
    const w = perWeek.get(start.getTime());
    return { start, minutes: Math.round(w?.minutes ?? 0), count: w?.count ?? 0 };
  });

  // cíl se plní dny s meditací, ne počtem meditací (dvě za den = pořád jeden den)
  const daysIn = (week: Date) => perWeek.get(week.getTime())?.days.size ?? 0;
  stats.weekDays = daysIn(weekStart);
  let week = stats.weekDays >= goal ? weekStart : addDays(weekStart, -7);
  while (daysIn(week) >= goal) {
    stats.weekStreak++;
    week = addDays(week, -7);
  }
  return stats;
}
