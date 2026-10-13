import { describe, expect, it } from "vitest";
import { addSet, finishWork, nextUp, setProgress, startWork, toggleDone, type ActiveWorkout } from "./active";
import { computeTrainingStats, newRecords, oneRepMax, personalRecords, prefillSets, workoutVolume, type SetEntry, type Workout } from "./data";

const set = (weight: number | null, reps: number | null, done = true, seconds: number | null = null): SetEntry => ({ weight, reps, seconds, done });
const w = (iso: string, exercises: Workout["exercises"]): Workout => ({
  id: iso, name: "Trénink", template_id: null, started_at: new Date(iso).toISOString(), finished_at: new Date(iso).toISOString(), exercises, note: null,
});

describe("trénink", () => {
  const now = new Date(2026, 9, 2, 20, 0); // pátek 2. 10. 2026
  const older = w("2026-09-21T18:00:00", [{ exercise_id: "b-db-bench", sets: [set(20, 10), set(20, 8), set(22, 6, false)] }]);
  const newer = w("2026-09-28T18:00:00", [{ exercise_id: "b-db-bench", sets: [set(22, 8), set(22, 7)] }, { exercise_id: "b-pushup", sets: [set(null, 25)] }]);
  const history = [newer, older];

  it("objem počítá jen odcvičené série", () => {
    expect(workoutVolume(older)).toBe(20 * 10 + 20 * 8);
  });

  it("předvyplnění z minula a opakování poslední série", () => {
    expect(prefillSets("b-db-bench", 3, history).map((s) => `${s.weight}×${s.reps}`)).toEqual(["22×8", "22×7", "22×7"]);
    expect(prefillSets("b-squat", 2, history)).toEqual([set(null, null, false), set(null, null, false)]);
    // cíl ze šablony doplní jen to, co chybí v historii
    expect(prefillSets("b-squat", 1, history, { mode: "reps", value: 15 })[0].reps).toBe(15);
    expect(prefillSets("b-plank", 1, history, { mode: "time", value: 40 })[0].seconds).toBe(40);
    expect(prefillSets("b-db-bench", 1, history, { mode: "reps", value: 12 })[0].reps).toBe(8);
    // cvik na opakování přepnutý na čas: opakování z minula se nepřenesou, platí cíl v sekundách
    expect(prefillSets("b-db-bench", 1, history, { mode: "time", value: 60 })[0]).toMatchObject({ weight: 22, reps: null, seconds: 60 });
  });

  it("osobní rekordy a nové rekordy", () => {
    const r = personalRecords(history).get("b-db-bench")!;
    expect(r.heaviest).toMatchObject({ weight: 22, reps: 8 });
    expect(r.best1rm).toBeCloseTo(oneRepMax(22, 8));
    expect(r.workouts).toBe(2);
    const today = w("2026-10-01T18:00:00", [{ exercise_id: "b-db-bench", sets: [set(24, 6)] }, { exercise_id: "b-pushup", sets: [set(null, 30)] }, { exercise_id: "b-squat", sets: [set(null, 40)] }]);
    expect(newRecords(today, history)).toEqual([
      { exercise_id: "b-db-bench", text: "24 kg × 6" },
      { exercise_id: "b-pushup", text: "30 opakování" },
    ]);
  });

  it("týdenní statistiky a série týdnů", () => {
    const list = [w("2026-09-29T18:00:00", []), w("2026-10-01T18:00:00", []), ...history];
    const s = computeTrainingStats(list, 2, now);
    // týden začíná pondělím 28. 9., takže trénink z 28. 9. se počítá do tohoto týdne
    expect(s.weekCount).toBe(3);
    expect(s.thisWeek).toEqual([1, 1, 0, 1, 0, null, null]);
    expect(s.weekStreak).toBe(1);
    expect(computeTrainingStats(list, 1, now).weekStreak).toBe(2);
  });

  it("odškrtnutí série spustí pauzu, nová série zkopíruje poslední", () => {
    const a: ActiveWorkout = { name: "X", template_id: null, started_at: "", exercises: [{ exercise_id: "b-db-bench", sets: [set(20, 10, false)] }], rest_until: null, rest_total: 0 };
    const done = toggleDone(a, 0, 0, 90, 1000);
    expect(done.exercises[0].sets[0].done).toBe(true);
    expect(done.rest_until).toBe(91_000);
    expect(addSet(done, 0).exercises[0].sets[1]).toEqual(set(20, 10, false));
  });

  it("série na čas: odpočet, po doběhnutí zapíše sekundy, odškrtne a spustí pauzu", () => {
    const a: ActiveWorkout = { name: "X", template_id: null, started_at: "", exercises: [{ exercise_id: "b-pushup", mode: "time", sets: [{ weight: null, reps: null, seconds: 60, done: false }] }], rest_until: 5, rest_total: 0 };
    const running = startWork(a, 0, 0, 60, 0);
    expect(running.rest_until).toBeNull();
    expect(running.work).toEqual({ ex: 0, set: 0, until: 60_000, total: 60 });
    const full = finishWork(running, 45, 60_000);
    expect(full.work).toBeNull();
    expect(full.exercises[0].sets[0]).toMatchObject({ seconds: 60, done: true });
    expect(full.rest_until).toBe(105_000);
    // „Hotovo“ dřív: zapíše, kolik se opravdu cvičilo
    expect(finishWork(running, 45, 42_400).exercises[0].sets[0].seconds).toBe(42);
  });
});

describe("odhad délky tréninku", () => {
  it("série, pauzy mezi sériemi a mezi cviky", async () => {
    const { estimateTemplate, formatMinutes } = await import("./data");
    const { BUILTIN_EXERCISES } = await import("./exercises");
    const byId = new Map(BUILTIN_EXERCISES.map((e) => [e.id, e]));
    // tlaky (pauza 120 s) 3 série + prkno (výdrž) 2 série s vlastní pauzou 30 s, mezi cviky 60 s
    const est = estimateTemplate([{ exercise_id: "b-db-bench", sets: 3 }, { exercise_id: "b-plank", sets: 2, rest_s: 30 }], byId, [], 60);
    expect(est.work).toBe(3 * 40 + 2 * 45);
    expect(est.rest).toBe(2 * 120 + 30 + 60);
    expect(est.total).toBe(540);
    expect(formatMinutes(est.total)).toBe("9 min");
    expect(formatMinutes(75 * 60)).toBe("1 h 15 min");
  });
});

describe("průběh tréninku", () => {
  const active = (exercises: ActiveWorkout["exercises"]): ActiveWorkout => ({
    name: "T", template_id: null, started_at: "2026-10-13T18:00:00Z", exercises, rest_until: null, rest_total: 0,
  });

  it("na řadě je první neodškrtnutá série v pořadí cviků", () => {
    const w = active([
      { exercise_id: "a", sets: [set(20, 8), set(20, 8)] },
      { exercise_id: "b", sets: [set(null, 10), set(null, 10, false), set(null, 10, false)] },
      { exercise_id: "c", sets: [set(null, 5, false)] },
    ]);
    expect(nextUp(w)).toEqual({ ex: 1, set: 1 });
    expect(setProgress(w)).toEqual({ done: 3, total: 6 });
  });

  it("přeskočený cvik zůstává na řadě, dokud není odcvičený", () => {
    const w = active([
      { exercise_id: "a", sets: [set(20, 8, false)] },
      { exercise_id: "b", sets: [set(null, 10)] },
    ]);
    expect(nextUp(w)).toEqual({ ex: 0, set: 0 });
  });

  it("když je vše odškrtnuté, nic není na řadě", () => {
    expect(nextUp(active([{ exercise_id: "a", sets: [set(20, 8)] }]))).toBeNull();
    expect(nextUp(active([]))).toBeNull();
    expect(setProgress(active([]))).toEqual({ done: 0, total: 0 });
  });
});
