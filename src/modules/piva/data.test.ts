import { describe, expect, it } from "vitest";
import { computeStats, type Beer } from "./data";

const beer = (iso: string, i = 0): Beer => ({ id: `${iso}-${i}`, drunk_at: new Date(iso).toISOString() });

describe("computeStats", () => {
  // Čtvrtek 1. 10. 2026, 20:00 místního času
  const now = new Date(2026, 9, 1, 20, 0);

  it("počítá dnešek, týden, měsíc, rok a celkem", () => {
    const beers = [
      beer("2026-10-01T18:00:00", 1), beer("2026-10-01T19:00:00", 2), // dnes
      beer("2026-09-28T21:00:00"), // pondělí tohoto týdne
      beer("2026-09-27T21:00:00"), // neděle minulého týdne
      beer("2025-12-31T21:00:00"), // loni
    ];
    const s = computeStats(beers, now);
    expect(s.today).toBe(2);
    expect(s.week).toBe(3);
    expect(s.month).toBe(2);
    expect(s.year).toBe(4);
    expect(s.total).toBe(5);
    expect(s.thisWeek).toEqual([1, 0, 0, 2, null, null, null]);
  });

  it("nezapočítá budoucí záznamy", () => {
    const s = computeStats([beer("2026-10-02T12:00:00")], now);
    expect(s.total).toBe(0);
  });

  it("počítá průměr podle dne v týdnu jen ze dnů od prvního záznamu", () => {
    // první záznam v pondělí 21. 9. → do čtvrtka 1. 10. jsou 2 pondělky až čtvrtky, ostatní dny po 1
    const beers = [
      beer("2026-09-21T20:00:00", 1), beer("2026-09-21T21:00:00", 2), // po
      beer("2026-09-25T20:00:00"), // pá
      beer("2026-09-28T20:00:00"), // po
    ];
    const s = computeStats(beers, now);
    expect(s.byWeekday[0]).toEqual({ total: 3, average: 1.5 });
    expect(s.byWeekday[4]).toEqual({ total: 1, average: 1 });
    expect(s.byWeekday[2]).toEqual({ total: 0, average: 0 });
    expect(s.bestDay?.count).toBe(2);
    expect(s.perDay).toBeCloseTo(4 / 11);
  });

  it("vrací posledních 12 týdnů s tímto týdnem na konci", () => {
    const s = computeStats([beer("2026-09-29T20:00:00"), beer("2026-09-22T20:00:00")], now);
    expect(s.lastWeeks).toHaveLength(12);
    expect(s.lastWeeks[11].count).toBe(1);
    expect(s.lastWeeks[10].count).toBe(1);
  });
});
