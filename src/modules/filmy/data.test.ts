import { describe, expect, it } from "vitest";
import { alreadyHave, computeMediaStats, newMedia, withStatus } from "./data";

describe("filmy a knihy – stav a statistiky", () => {
  const now = new Date(2026, 9, 2);
  it("hotovo doplní datum, jiný stav ho smaže", () => {
    const m = newMedia({ kind: "kniha", title: "Saturnin" });
    const done = withStatus(m, "hotovo", now);
    expect(done.finished_at).toBe("2026-10-02");
    expect(withStatus(done, "chci").finished_at).toBeNull();
  });

  it("statistiky a duplicity", () => {
    const list = [
      newMedia({ kind: "kniha", title: "A", status: "hotovo", finished_at: "2026-03-01", rating: 4 }),
      newMedia({ kind: "kniha", title: "B", status: "hotovo", finished_at: "2025-12-01", rating: 2 }),
      newMedia({ kind: "film", title: "C", status: "hotovo", finished_at: "2026-09-01" }),
      newMedia({ kind: "film", title: "D" }),
      newMedia({ kind: "serial", title: "E", status: "ted" }),
    ];
    const s = computeMediaStats(list, now);
    expect(s).toMatchObject({ wanted: 1, inProgress: 1, booksThisYear: 1, averageRating: 3 });
    expect(s.doneThisYear).toEqual({ film: 1, serial: 0, kniha: 1 });
    expect(alreadyHave(list, { kind: "film", title: "d", source: "rucne", source_id: null })).toBe(true);
    expect(alreadyHave(list, { kind: "kniha", title: "D", source: "rucne", source_id: null })).toBe(false);
  });
});
