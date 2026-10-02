import { describe, expect, it } from "vitest";
import { computeGratitudeStats, type Gratitude } from "./data";

const g = (day: string, n = 0): Gratitude => ({ id: `${day}-${n}`, day, text: `Díky ${day}`, created_at: `${day}T20:0${n}:00.000Z` });

describe("statistiky vděčnosti", () => {
  const now = new Date(2026, 9, 2, 20, 0); // pátek 2. 10. 2026

  it("série dní v řadě včetně dneška", () => {
    const s = computeGratitudeStats([g("2026-10-02"), g("2026-10-02", 1), g("2026-10-01"), g("2026-09-30"), g("2026-09-28")], now);
    expect(s.today).toHaveLength(2);
    expect(s.streak).toBe(3);
    expect(s.bestStreak).toBe(3);
    expect(s.weekDays).toBe(4);
    expect(s.total).toBe(5);
    expect(s.totalDays).toBe(4);
  });

  it("nezapsaný dnešek série nepřeruší, přeruší ji až vynechaný den", () => {
    expect(computeGratitudeStats([g("2026-10-01"), g("2026-09-30")], now).streak).toBe(2);
    expect(computeGratitudeStats([g("2026-09-30")], now).streak).toBe(0);
  });

  it("nejdelší série přes konec měsíce", () => {
    const list = ["2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-10"].map((d) => g(d));
    expect(computeGratitudeStats(list, now).bestStreak).toBe(4);
  });

  it("mozaika po týdnech a před rokem", () => {
    const s = computeGratitudeStats([g("2026-10-02"), g("2026-10-02", 1), g("2026-09-28"), g("2025-10-02")], now, 2);
    expect(s.mosaic).toEqual([[0, 0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 2, null, null]]);
    expect(s.yearAgo.map((x) => x.day)).toEqual(["2025-10-02"]);
    expect(s.memory?.day).toBe("2025-10-02");
  });
});
