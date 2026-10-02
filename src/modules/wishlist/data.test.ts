import { describe, expect, it } from "vitest";
import { closeWish, computeWishStats, daysToWait, newWish, parsePrice, sortWishes } from "./data";

describe("wishlist", () => {
  const now = new Date(2026, 9, 2, 12);

  it("pravidlo 30 dní", () => {
    const w = newWish({ title: "Sluchátka" }, true, now);
    expect(w.wait_until).toBe("2026-11-01");
    expect(daysToWait(w, now)).toBe(30);
    expect(daysToWait(w, new Date(2026, 10, 1))).toBe(0);
    expect(daysToWait(newWish({ title: "X" }, false, now), now)).toBe(0);
  });

  it("cena z textu", () => {
    expect(parsePrice("1 299,90 Kč")).toBe(1299.9);
    expect(parsePrice("2499,-")).toBe(2499);
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("abc")).toBeNull();
  });

  it("statistiky a pořadí", () => {
    const a = newWish({ title: "A", price: 1000, priority: 1 }, false, now);
    const b = newWish({ title: "B", price: 500, priority: 3 }, true, now);
    const c = closeWish(newWish({ title: "C", price: 2000 }, false, now), "nechci", now);
    const d = closeWish(newWish({ title: "D", price: 300 }, false, now), "koupeno", now);
    expect(computeWishStats([a, b, c, d], now)).toEqual({ open: 2, openTotal: 1500, waiting: 1, bought: 1, boughtTotal: 300, saved: 2000 });
    expect(sortWishes([a, b], now).map((w) => w.title)).toEqual(["B", "A"]);
    expect(c.closed_at).toBe("2026-10-02");
  });
});
