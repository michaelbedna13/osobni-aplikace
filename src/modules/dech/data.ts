import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";
import { startOfWeek } from "../../lib/dates";

export interface BreathSession {
  id: string;
  exercise: string;
  started_at: string;
  duration_s: number;
  cycles: number;
  holds: number[];
  created_at: string;
}

const store = createStore<BreathSession>("breathing_sessions", "started_at");
const KEY = ["breathing_sessions"];
const byNewest = (a: BreathSession, b: BreathSession) => b.started_at.localeCompare(a.started_at);

export const useBreathSessions = () =>
  useQuery({ queryKey: KEY, queryFn: async () => (await store.list("1970-01-01T00:00:00.000Z")).sort(byNewest) });

export function useAddBreathSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (s: BreathSession) => store.insert(s),
    onMutate: async (s) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      queryClient.setQueryData<BreathSession[]>(KEY, (l = []) => [s, ...l].sort(byNewest));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteBreathSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => store.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      queryClient.setQueryData<BreathSession[]>(KEY, (l = []) => l.filter((s) => s.id !== id));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export interface BreathStats {
  weekCount: number;
  weekMinutes: number;
  totalMinutes: number;
  total: number;
  bestHold: number | null;
  /** Nejčastější cvičení (klíč). */
  favorite: string | null;
}

export function computeBreathStats(list: BreathSession[], now = new Date()): BreathStats {
  const week = startOfWeek(now).getTime();
  const thisWeek = list.filter((s) => new Date(s.started_at).getTime() >= week);
  const counts = new Map<string, number>();
  for (const s of list) counts.set(s.exercise, (counts.get(s.exercise) ?? 0) + 1);
  const holds = list.flatMap((s) => s.holds ?? []);
  return {
    weekCount: thisWeek.length,
    weekMinutes: Math.round(thisWeek.reduce((m, s) => m + s.duration_s, 0) / 60),
    totalMinutes: Math.round(list.reduce((m, s) => m + s.duration_s, 0) / 60),
    total: list.length,
    bestHold: holds.length ? Math.max(...holds) : null,
    favorite: [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
  };
}
