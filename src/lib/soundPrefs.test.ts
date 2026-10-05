import { describe, expect, it } from "vitest";
import { DEFAULT_SOUNDS, sanitizeSoundPrefs } from "./soundPrefs";

describe("nastavení zvuků", () => {
  it("neznámé hodnoty nahradí výchozími", () => {
    const s = sanitizeSoundPrefs({ medStart: "miska", medEnd: "xyz" as never, medInterval: 500 });
    expect(s.medStart).toBe("miska");
    expect(s.medEnd).toBe(DEFAULT_SOUNDS.medEnd);
    expect(s.medInterval).toBe(0);
  });
});
