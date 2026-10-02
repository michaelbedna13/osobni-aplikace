import { describe, expect, it } from "vitest";
import { addSet, toggleDone, type ActiveWorkout } from "./active";
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
});
