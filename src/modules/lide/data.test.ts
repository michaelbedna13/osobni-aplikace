import { describe, expect, it } from "vitest";
import { namedayFor, soonOccasions, upcomingOccasions, type Person } from "./data";
import { buildIcs } from "./ics";

const p = (name: string, birth: [number, number, number | null] | null, nameday: string | null = null): Person => ({
  id: name, name, birth_day: birth?.[0] ?? null, birth_month: birth?.[1] ?? null, birth_year: birth?.[2] ?? null, nameday, note: null, created_at: "2026-01-01T00:00:00.000Z",
});

describe("lidé a oslavy", () => {
  const now = new Date(2026, 9, 2, 20, 0); // pátek 2. 10. 2026

  it("řadí nejbližší oslavy a počítá věk", () => {
    const list = upcomingOccasions([p("Míša", [5, 10, 1996], "09-29"), p("Jana", [2, 10, null]), p("Petr", [1, 10, 1990])], now);
    expect(list.map((o) => `${o.person.name} ${o.kind} ${o.days}`)).toEqual([
      "Jana narozeniny 0", "Míša narozeniny 3", "Míša jmeniny 362", "Petr narozeniny 364",
    ]);
    expect(list[1].age).toBe(30);
    expect(list[0].age).toBeNull();
  });

  it("29. února slaví v nepřestupném roce 28. února", () => {
    const [o] = upcomingOccasions([p("Leon", [29, 2, 2000])], now);
    expect(o.date).toEqual(new Date(2027, 1, 28));
  });

  it("oslavy v příštím týdnu", () => {
    expect(soonOccasions([p("Míša", [5, 10, 1996]), p("Petr", [20, 10, 1990])], 7, now).map((o) => o.person.name)).toEqual(["Míša"]);
  });

  it("jmeniny podle křestního jména", () => {
    expect(namedayFor("Oliver Novák")).toBe("10-02");
    expect(namedayFor("Xyz")).toBeNull();
  });

  it("kalendář .ics", () => {
    const ics = buildIcs([p("Míša, kamarád", [5, 10, 1996], "09-29")], now);
    expect(ics).toContain("DTSTART;VALUE=DATE:19961005");
    expect(ics).toContain("SUMMARY:Narozeniny: Míša\\, kamarád");
    expect(ics).toContain("DTSTART;VALUE=DATE:20000929");
    expect(ics.split("BEGIN:VEVENT")).toHaveLength(3);
  });
});
