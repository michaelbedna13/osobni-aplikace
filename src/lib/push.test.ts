import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, NOTIFY_TYPES, normalizePrefs } from "./push";

describe("normalizePrefs", () => {
  it("bez nastavení je všechno zapnuté s výchozí hodinou", () => {
    expect(normalizePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(Object.keys(DEFAULT_PREFS)).toEqual(NOTIFY_TYPES.map((t) => t.key));
  });

  it("drží uložené hodnoty a zahodí nesmysly", () => {
    const prefs = normalizePrefs({ meditace: { on: false, hour: 7 }, nakup: { on: "ano", hour: 25 }, cizi: { on: false } });
    expect(prefs.meditace).toEqual({ on: false, hour: 7 });
    expect(prefs.nakup).toEqual({ on: true, hour: 16 });
    expect(prefs).not.toHaveProperty("cizi");
  });
});
