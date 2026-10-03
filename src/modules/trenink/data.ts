import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createStore } from "../../lib/db";
import { addDays, startOfDay, startOfMonth, startOfWeek } from "../../lib/dates";
import { BUILTIN_EXERCISES, type Exercise } from "./exercises";

export interface SetEntry {
  weight: number | null;
  reps: number | null;
  seconds: number | null;
  done: boolean;
}

export interface WorkoutExercise {
  exercise_id: string;
  sets: SetEntry[];
  /** Pauza po sérii podle tréninku (jinak výchozí pauza cviku). */
  rest_s?: number;
}

export interface Workout {
  id: string;
  name: string;
  template_id: string | null;
  started_at: string;
  finished_at: string;
  exercises: WorkoutExercise[];
  note: string | null;
}

export interface TemplateItem {
  exercise_id: string;
  sets: number;
  /** Pauza mezi sériemi; když chybí, platí výchozí pauza cviku. */
  rest_s?: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  items: TemplateItem[];
  /** Pauza mezi cviky (s). */
  rest_between_s?: number;
  created_at: string;
}

type CustomExercise = Exercise & { created_at: string };

const EPOCH = "1970-01-01T00:00:00.000Z";
const exerciseStore = createStore<CustomExercise>("exercises", "created_at");
const templateStore = createStore<WorkoutTemplate>("workout_templates", "created_at");
const workoutStore = createStore<Workout>("workouts", "started_at");
const KEYS = { exercises: ["exercises"], templates: ["workout_templates"], workouts: ["workouts"] };

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "cs");
const byNewest = (a: Workout, b: Workout) => b.started_at.localeCompare(a.started_at);

export const useCustomExercises = () =>
  useQuery({ queryKey: KEYS.exercises, queryFn: async () => (await exerciseStore.list(EPOCH)).sort(byName) });
export const useTemplates = () =>
  useQuery({ queryKey: KEYS.templates, queryFn: async () => (await templateStore.list(EPOCH)).sort(byName) });
export const useWorkouts = () =>
  useQuery({ queryKey: KEYS.workouts, queryFn: async () => (await workoutStore.list(EPOCH)).sort(byNewest) });

/** Všechny cviky (vestavěné + vlastní) a rychlé hledání podle id. */
export function useExercises() {
  const { data: custom = [] } = useCustomExercises();
  return useMemo(() => {
    const all = [...BUILTIN_EXERCISES, ...custom].sort(byName);
    const byId = new Map(all.map((e) => [e.id, e]));
    return { all, byId };
  }, [custom]);
}

function useListMutation<T, V>(key: string[], sort: (a: T, b: T) => number, fn: (vars: V) => Promise<void>, apply: (list: T[], vars: V) => T[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<T[]>(key);
      queryClient.setQueryData<T[]>(key, (list = []) => apply(list, vars).sort(sort));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export const useAddExercise = () =>
  useListMutation<CustomExercise, CustomExercise>(KEYS.exercises, byName, ({ builtin: _b, ...e }) => exerciseStore.insert(e), (l, e) => [...l, e]);
export const useAddTemplate = () =>
  useListMutation<WorkoutTemplate, WorkoutTemplate>(KEYS.templates, byName, (t) => templateStore.insert(t), (l, t) => [...l, t]);
export const useUpdateTemplate = () =>
  useListMutation<WorkoutTemplate, WorkoutTemplate>(KEYS.templates, byName, ({ id, name, items, rest_between_s }) => templateStore.update(id, { name, items, rest_between_s }), (l, t) => l.map((x) => (x.id === t.id ? t : x)));
export const useDeleteTemplate = () =>
  useListMutation<WorkoutTemplate, string>(KEYS.templates, byName, (id) => templateStore.remove(id), (l, id) => l.filter((t) => t.id !== id));
export const useAddWorkout = () =>
  useListMutation<Workout, Workout>(KEYS.workouts, byNewest, (w) => workoutStore.insert(w), (l, w) => [...l, w]);
export const useDeleteWorkout = () =>
  useListMutation<Workout, string>(KEYS.workouts, byNewest, (id) => workoutStore.remove(id), (l, id) => l.filter((w) => w.id !== id));

export function newCustomExercise(fields: Omit<Exercise, "id" | "builtin">): CustomExercise {
  return { ...fields, id: crypto.randomUUID(), created_at: new Date().toISOString() };
}

// ---------- výpočty ----------

const doneSets = (we: WorkoutExercise) => we.sets.filter((s) => s.done);

/** Objem tréninku: součet váha × opakování u odcvičených sérií. */
export const workoutVolume = (w: Workout) =>
  w.exercises.reduce((sum, we) => sum + doneSets(we).reduce((s, set) => s + (set.weight ?? 0) * (set.reps ?? 0), 0), 0);

export const doneSetCount = (w: Workout) => w.exercises.reduce((n, we) => n + doneSets(we).length, 0);

/** Odhad maxima na 1 opakování (Epley). */
export const oneRepMax = (weight: number, reps: number) => (reps <= 1 ? weight : weight * (1 + reps / 30));

/** Série z posledního tréninku, kde cvik byl (pro předvyplnění). */
export function lastSetsFor(exerciseId: string, workouts: Workout[]): SetEntry[] {
  for (const w of workouts) {
    const we = w.exercises.find((e) => e.exercise_id === exerciseId && doneSets(e).length > 0);
    if (we) return doneSets(we);
  }
  return [];
}

/** Nové série pro cvik: čísla z minula, chybějící série zopakují tu poslední. */
export function prefillSets(exerciseId: string, count: number, workouts: Workout[]): SetEntry[] {
  const last = lastSetsFor(exerciseId, workouts);
  return Array.from({ length: Math.max(1, count) }, (_, i) => {
    const src = last[Math.min(i, last.length - 1)];
    return { weight: src?.weight ?? null, reps: src?.reps ?? null, seconds: src?.seconds ?? null, done: false };
  });
}

export interface ExerciseRecord {
  exercise_id: string;
  /** Nejtěžší série (váha, při shodě víc opakování). */
  heaviest: { weight: number; reps: number; date: string } | null;
  /** Nejvyšší odhad 1RM. */
  best1rm: number | null;
  /** Nejvíc opakování v sérii (cviky s vlastní vahou). */
  maxReps: { reps: number; date: string } | null;
  /** Nejdelší výdrž v sekundách. */
  maxSeconds: { seconds: number; date: string } | null;
  workouts: number;
}

export function personalRecords(workouts: Workout[]): Map<string, ExerciseRecord> {
  const records = new Map<string, ExerciseRecord>();
  for (const w of [...workouts].sort((a, b) => a.started_at.localeCompare(b.started_at))) {
    for (const we of w.exercises) {
      const sets = doneSets(we);
      if (!sets.length) continue;
      const r = records.get(we.exercise_id) ?? { exercise_id: we.exercise_id, heaviest: null, best1rm: null, maxReps: null, maxSeconds: null, workouts: 0 };
      r.workouts++;
      for (const s of sets) {
        if (s.weight && s.reps) {
          if (!r.heaviest || s.weight > r.heaviest.weight || (s.weight === r.heaviest.weight && s.reps > r.heaviest.reps)) {
            r.heaviest = { weight: s.weight, reps: s.reps, date: w.started_at };
          }
          r.best1rm = Math.max(r.best1rm ?? 0, oneRepMax(s.weight, s.reps));
        }
        if (s.reps && !s.weight && (!r.maxReps || s.reps > r.maxReps.reps)) r.maxReps = { reps: s.reps, date: w.started_at };
        if (s.seconds && (!r.maxSeconds || s.seconds > r.maxSeconds.seconds)) r.maxSeconds = { seconds: s.seconds, date: w.started_at };
      }
      records.set(we.exercise_id, r);
    }
  }
  return records;
}

/** Rekordy, které nový trénink překonal (oproti dřívějším tréninkům). */
export function newRecords(workout: Workout, previous: Workout[]): { exercise_id: string; text: string }[] {
  const before = personalRecords(previous);
  const after = personalRecords([...previous, workout]);
  const out: { exercise_id: string; text: string }[] = [];
  for (const we of workout.exercises) {
    const a = after.get(we.exercise_id);
    const b = before.get(we.exercise_id);
    if (!a || !b) continue; // první trénink cviku není rekord
    if (a.heaviest && (!b.heaviest || a.heaviest.weight > b.heaviest.weight)) out.push({ exercise_id: we.exercise_id, text: `${formatKg(a.heaviest.weight)} × ${a.heaviest.reps}` });
    else if (a.maxReps && b.maxReps && a.maxReps.reps > b.maxReps.reps) out.push({ exercise_id: we.exercise_id, text: `${a.maxReps.reps} opakování` });
    else if (a.maxSeconds && b.maxSeconds && a.maxSeconds.seconds > b.maxSeconds.seconds) out.push({ exercise_id: we.exercise_id, text: formatSeconds(a.maxSeconds.seconds) });
  }
  return out;
}

export interface TrainingStats {
  weekCount: number;
  /** Tréninky po dnech tohoto týdne (Po–Ne); budoucí dny null. */
  thisWeek: (number | null)[];
  todayIndex: number;
  monthCount: number;
  total: number;
  weekStreak: number;
  weekVolume: number;
  lastWeeks: { start: Date; count: number }[];
}

export function computeTrainingStats(workouts: Workout[], goal: number, now = new Date()): TrainingStats {
  const weekStart = startOfWeek(now);
  const todayIndex = (now.getDay() + 6) % 7;
  const tomorrow = addDays(startOfDay(now), 1).getTime();
  const perDay = new Map<number, number>();
  const perWeek = new Map<number, number>();
  let weekCount = 0, monthCount = 0, total = 0, weekVolume = 0;
  for (const w of workouts) {
    const d = new Date(w.started_at);
    if (Number.isNaN(d.getTime()) || d.getTime() >= tomorrow) continue;
    total++;
    if (d >= weekStart) { weekCount++; weekVolume += workoutVolume(w); }
    if (d >= startOfMonth(now)) monthCount++;
    const day = startOfDay(d).getTime();
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
    const week = startOfWeek(d).getTime();
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1);
  }
  let weekStreak = 0;
  for (let week = weekCount >= goal ? weekStart : addDays(weekStart, -7); (perWeek.get(week.getTime()) ?? 0) >= goal; week = addDays(week, -7)) weekStreak++;
  return {
    weekCount, todayIndex, monthCount, total, weekStreak, weekVolume,
    thisWeek: Array.from({ length: 7 }, (_, i) => (i <= todayIndex ? perDay.get(addDays(weekStart, i).getTime()) ?? 0 : null)),
    lastWeeks: Array.from({ length: 12 }, (_, i) => {
      const start = addDays(weekStart, -7 * (11 - i));
      return { start, count: perWeek.get(start.getTime()) ?? 0 };
    }),
  };
}

export const formatKg = (kg: number) => `${kg.toLocaleString("cs-CZ", { maximumFractionDigits: 2 })} kg`;
export function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  return m ? `${m}:${String(s % 60).padStart(2, "0")}` : `${s} s`;
}

/** Krátký popis série: „20 kg × 10“, „12×“, „45 s“. */
export function formatSet(s: SetEntry) {
  if (s.seconds) return formatSeconds(s.seconds);
  if (s.weight) return `${s.weight.toLocaleString("cs-CZ")} × ${s.reps ?? 0}`;
  return `${s.reps ?? 0}×`;
}

// ---------- odhad délky tréninku ----------

export const DEFAULT_REST_BETWEEN = 120;
/** Odhad doby jedné série s opakováním (s). */
const REP_SET_S = 40;

/** Doba jedné série: u výdrže podle posledního tréninku (jinak 45 s), jinak ~40 s. */
export function setSeconds(e: Exercise | undefined, workouts: Workout[]): number {
  if (e?.kind !== "time") return REP_SET_S;
  const last = lastSetsFor(e.id, workouts).map((s) => s.seconds ?? 0).filter(Boolean);
  return last.length ? Math.round(last.reduce((a, b) => a + b, 0) / last.length) : 45;
}

export interface Estimate { work: number; rest: number; total: number }

/** Odhad délky tréninku: série + pauzy mezi sériemi + pauzy mezi cviky (v sekundách). */
export function estimateTemplate(items: TemplateItem[], byId: Map<string, Exercise>, workouts: Workout[], restBetween = DEFAULT_REST_BETWEEN): Estimate {
  let work = 0;
  let rest = 0;
  items.forEach((it, i) => {
    const e = byId.get(it.exercise_id);
    work += it.sets * setSeconds(e, workouts);
    rest += Math.max(0, it.sets - 1) * (it.rest_s ?? e?.rest_s ?? 90);
    if (i < items.length - 1) rest += restBetween;
  });
  return { work, rest, total: work + rest };
}

/** „~35 min“, „~1 h 10 min“ */
export function formatMinutes(seconds: number) {
  const m = Math.max(1, Math.round(seconds / 60));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`;
}
