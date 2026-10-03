import { describe, expect, it } from "vitest";
import { daysUntil, nextFriday13 } from "./data";
import { MEANINGS, MEANING_CATEGORIES } from "./meanings";

describe("untrois", () => {
  it("příští pátek 13.", () => {
    expect(nextFriday13(new Date(2026, 9, 2))).toEqual(new Date(2026, 10, 13));
    expect(nextFriday13(new Date(2026, 10, 13, 18))).toEqual(new Date(2026, 10, 13));
    expect(nextFriday13(new Date(2026, 10, 14))).toEqual(new Date(2027, 7, 13));
    expect(daysUntil(new Date(2026, 10, 13), new Date(2026, 9, 2, 20))).toBe(42);
  });

  it("každý význam má známou kategorii", () => {
    expect(MEANINGS.every((m) => (MEANING_CATEGORIES as readonly string[]).includes(m.category))).toBe(true);
  });
});
