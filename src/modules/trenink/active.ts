// Probíhající trénink: drží se v localStorage, takže přežije zavření appky i zamčení telefonu.
import { useCallback, useSyncExternalStore } from "react";
import type { SetEntry, WorkoutExercise } from "./data";

export interface ActiveWorkout {
  name: string;
  template_id: string | null;
  started_at: string;
  exercises: WorkoutExercise[];
  /** Konec pauzy (ms od epochy), nebo null. */
  rest_until: number | null;
  rest_total: number;
  /** Běžící série na čas: který cvik a série, konec (ms od epochy) a délka v s. */
  work?: { ex: number; set: number; until: number; total: number } | null;
}

const KEY = "trenink:active";
const listeners = new Set<() => void>();
let cache: ActiveWorkout | null | undefined;

function read(): ActiveWorkout | null {
  if (cache !== undefined) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null") as ActiveWorkout | null;
    cache = parsed && Array.isArray(parsed.exercises) ? parsed : null;
  } catch {
    cache = null;
  }
  return cache;
}

function write(next: ActiveWorkout | null) {
  cache = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // bez úložiště trénink vydrží jen do zavření appky
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useActiveWorkout() {
  const active = useSyncExternalStore(subscribe, read, () => null);
  const update = useCallback((fn: (w: ActiveWorkout) => ActiveWorkout) => {
    const current = read();
    if (current) write(fn(current));
  }, []);
  return { active, start: write, update, clear: () => write(null) };
}

// ---------- čisté úpravy stavu (testované) ----------

export function setField(w: ActiveWorkout, ex: number, set: number, patch: Partial<SetEntry>): ActiveWorkout {
  return {
    ...w,
    exercises: w.exercises.map((we, i) => (i !== ex ? we : { ...we, sets: we.sets.map((s, j) => (j === set ? { ...s, ...patch } : s)) })),
  };
}

/** Odškrtnutí série; při odškrtnutí se spustí pauza. */
export function toggleDone(w: ActiveWorkout, ex: number, set: number, restSeconds: number, now = Date.now()): ActiveWorkout {
  const done = !w.exercises[ex].sets[set].done;
  const next = setField(w, ex, set, { done });
  return done && restSeconds > 0 ? { ...next, rest_until: now + restSeconds * 1000, rest_total: restSeconds } : next;
}

/** Spustí odpočet série na čas (zruší případnou pauzu). */
export function startWork(w: ActiveWorkout, ex: number, set: number, seconds: number, now = Date.now()): ActiveWorkout {
  return { ...w, rest_until: null, work: { ex, set, until: now + seconds * 1000, total: seconds } };
}

/** Konec série na čas (doběhla nebo „Hotovo“): zapíše odcvičené sekundy, odškrtne a spustí pauzu. */
export function finishWork(w: ActiveWorkout, restSeconds: number, now = Date.now()): ActiveWorkout {
  if (!w.work) return w;
  const { ex, set, until, total } = w.work;
  const done = Math.max(1, Math.min(total, Math.round(total - Math.max(0, until - now) / 1000)));
  const next = setField({ ...w, work: null }, ex, set, { seconds: done });
  return next.exercises[ex]?.sets[set]?.done ? next : toggleDone(next, ex, set, restSeconds, now);
}

export function addSet(w: ActiveWorkout, ex: number): ActiveWorkout {
  return {
    ...w,
    exercises: w.exercises.map((we, i) => {
      if (i !== ex) return we;
      const last = we.sets[we.sets.length - 1];
      return { ...we, sets: [...we.sets, { weight: last?.weight ?? null, reps: last?.reps ?? null, seconds: last?.seconds ?? null, done: false }] };
    }),
  };
}

export function removeSet(w: ActiveWorkout, ex: number): ActiveWorkout {
  return { ...w, exercises: w.exercises.map((we, i) => (i === ex && we.sets.length > 1 ? { ...we, sets: we.sets.slice(0, -1) } : we)) };
}

export function moveExercise(w: ActiveWorkout, ex: number, dir: -1 | 1): ActiveWorkout {
  const to = ex + dir;
  if (to < 0 || to >= w.exercises.length) return w;
  const list = [...w.exercises];
  [list[ex], list[to]] = [list[to], list[ex]];
  // běžící série na čas se posouvá s cvikem
  const work = w.work && (w.work.ex === ex ? { ...w.work, ex: to } : w.work.ex === to ? { ...w.work, ex } : w.work);
  return { ...w, exercises: list, work };
}

export const removeExercise = (w: ActiveWorkout, ex: number): ActiveWorkout => ({
  ...w,
  exercises: w.exercises.filter((_, i) => i !== ex),
  work: !w.work || w.work.ex < ex ? w.work : w.work.ex === ex ? null : { ...w.work, ex: w.work.ex - 1 },
});
