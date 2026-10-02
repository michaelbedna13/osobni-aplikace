import { describe, expect, it } from "vitest";
import { easterSunday, nameDay, publicHoliday } from "./calendar";

describe("kalendář", () => {
  it("Velikonoce", () => {
    expect(easterSunday(2026)).toEqual(new Date(2026, 3, 5));
    expect(easterSunday(2027)).toEqual(new Date(2027, 2, 28));
    expect(publicHoliday(new Date(2026, 3, 3))).toBe("Velký pátek");
    expect(publicHoliday(new Date(2026, 3, 6))).toBe("Velikonoční pondělí");
  });

  it("pevné svátky a běžný den", () => {
    expect(publicHoliday(new Date(2026, 9, 28))).toBe("Vznik Československa");
    expect(publicHoliday(new Date(2026, 9, 2))).toBeNull();
  });

  it("jmeniny", () => {
    expect(nameDay(new Date(2026, 9, 2))).toBe("Olívie a Oliver");
    expect(nameDay(new Date(2026, 0, 6))).toBe("Kašpar, Melichar a Baltazar");
    expect(nameDay(new Date(2026, 0, 1))).toBeNull();
  });
});
