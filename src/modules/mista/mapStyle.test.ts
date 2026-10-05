import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import { describe, expect, it } from "vitest";
import { MAP_STYLE } from "./mapStyle";

describe("styl mapy", () => {
  it("odpovídá specifikaci MapLibre", () => {
    expect(validateStyleMin(MAP_STYLE as never)).toEqual([]);
  });

  it("všechny vrstvy mají jedinečné id", () => {
    const ids = MAP_STYLE.layers.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
