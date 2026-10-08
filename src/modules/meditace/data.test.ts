import { describe, expect, it } from "vitest";
import { computeMeditationStats, formatDuration, type Meditation } from "./data";
import { elapsedSeconds, finalSeconds, isFinished, pauseTimer, resumeTimer, startTimer } from "./timer";

const m = (iso: string, minutes: number): Meditation => ({ id: iso, started_at: new Date(iso).toISOString(), duration_s: minutes * 60, note: null });

describe("statistiky meditace", () => {
  const now = new Date(2026, 9, 2, 20, 0); // pátek 2. 10. 2026

  it("počítá tento týden, dny a průměr", () => {
    const s = computeMeditationStats([m("2026-09-28T07:00:00", 10), m("2026-10-01T07:00:00", 20), m("2026-09-20T07:00:00", 30)], 5, now);
    expect(s.weekCount).toBe(2);
    expect(s.weekMinutes).toBe(30);
    expect(s.thisWeek).toEqual([10, 0, 0, 20, 0, null, null]);
    expect(s.totalCount).toBe(3);
    expect(s.averageMinutes).toBe(20);
    expect(s.longest?.duration_s).toBe(1800);
  });

  it("série týdnů se splněným cílem", () => {
    const list = [
      // minulý týden 2×, předminulý 2×, tento 1×
      m("2026-09-21T07:00:00", 10), m("2026-09-22T07:00:00", 10),
      m("2026-09-14T07:00:00", 10), m("2026-09-15T07:00:00", 10),
      m("2026-09-29T07:00:00", 10),
    ];
    expect(computeMeditationStats(list, 2, now).weekStreak).toBe(2);
    // když je cíl splněný i tento týden, počítá se
    expect(computeMeditationStats([...list, m("2026-09-30T07:00:00", 10)], 2, now).weekStreak).toBe(3);
    expect(computeMeditationStats(list, 3, now).weekStreak).toBe(0);
  });

  it("cíl se plní dny, ne počtem meditací", () => {
    // tento týden: pondělí 2×, čtvrtek 1× = 3 meditace, ale 2 dny
    const week = [m("2026-09-28T07:00:00", 10), m("2026-09-28T21:00:00", 10), m("2026-10-01T07:00:00", 10)];
    const s = computeMeditationStats(week, 3, now);
    expect(s.weekCount).toBe(3);
    expect(s.weekDays).toBe(2);
    expect(s.weekStreak).toBe(0);
    // minulý týden 3 meditace v jednom dni cíl 2 dny nesplní
    const last = [m("2026-09-21T07:00:00", 10), m("2026-09-21T12:00:00", 10), m("2026-09-21T20:00:00", 10)];
    expect(computeMeditationStats(last, 2, now).weekStreak).toBe(0);
    expect(computeMeditationStats([...week, ...last], 2, now).weekStreak).toBe(1);
  });

  it("formátuje délku", () => {
    expect(formatDuration(45)).toBe("45 s");
    expect(formatDuration(900)).toBe("15 min");
    expect(formatDuration(3900)).toBe("1 h 5 min");
  });
});

describe("časovač", () => {
  it("počítá čas i s pozastavením", () => {
    let t = startTimer(600, 0);
    expect(elapsedSeconds(t, 60_000)).toBe(60);
    t = pauseTimer(t, 60_000);
    expect(elapsedSeconds(t, 500_000)).toBe(60);
    t = resumeTimer(t, 500_000);
    expect(elapsedSeconds(t, 560_000)).toBe(120);
    expect(isFinished(t, 560_000)).toBe(false);
    expect(isFinished(t, 1_100_000)).toBe(true);
    expect(finalSeconds(t, 2_000_000)).toBe(600);
  });

  it("stopky bez omezení nikdy neskončí samy", () => {
    const t = startTimer(null, 0);
    expect(isFinished(t, 10_000_000)).toBe(false);
    expect(finalSeconds(t, 90_000)).toBe(90);
  });
});
