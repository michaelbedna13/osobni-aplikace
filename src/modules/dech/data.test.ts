import { describe, expect, it } from "vitest";
import { computeBreathStats, type BreathSession } from "./data";
import { EXERCISE_BY_KEY, cycleSeconds, phaseAt } from "./exercises";

const s = (iso: string, f: Partial<BreathSession> = {}): BreathSession => ({ id: iso, exercise: "krabice", started_at: new Date(iso).toISOString(), duration_s: 240, cycles: 15, holds: [], created_at: "", ...f });

describe("dechová cvičení", () => {
  it("fáze v rytmu", () => {
    const box = EXERCISE_BY_KEY.krabice;
    expect(cycleSeconds(box)).toBe(16);
    expect(phaseAt(box, 0)).toMatchObject({ index: 0, cycle: 0 });
    expect(phaseAt(box, 5)).toMatchObject({ index: 1, left: 3 });
    expect(phaseAt(box, 17)).toMatchObject({ index: 0, cycle: 1 });
    expect(phaseAt(EXERCISE_BY_KEY.vzdech, 2.5).phase.label).toBe("Ještě kousek nádechu");
  });

  it("statistiky", () => {
    const st = computeBreathStats([
      s("2026-10-01T08:00:00"),
      s("2026-10-02T08:00:00", { exercise: "wimhof", duration_s: 600, holds: [62, 85, 97] }),
      s("2026-09-20T08:00:00", { exercise: "wimhof", holds: [70] }),
    ], new Date(2026, 9, 2, 20));
    expect(st).toMatchObject({ weekCount: 2, weekMinutes: 14, total: 3, bestHold: 97, favorite: "wimhof" });
  });
});
