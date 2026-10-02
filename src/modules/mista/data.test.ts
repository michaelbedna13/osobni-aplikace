import { describe, expect, it } from "vitest";
import { distanceKm, formatKm, fromPhoton, navLinks } from "./data";

describe("místa", () => {
  it("vzdálenost Praha – Brno", () => {
    const km = distanceKm({ lat: 50.0755, lng: 14.4378 }, { lat: 49.1951, lng: 16.6068 });
    expect(km).toBeGreaterThan(180);
    expect(km).toBeLessThan(190);
    expect(formatKm(0.35)).toBe("350 m");
    expect(formatKm(3.25)).toBe("3,3 km");
    expect(formatKm(185.4)).toBe("185 km");
  });

  it("převod výsledků Photonu", () => {
    expect(fromPhoton([
      { geometry: { coordinates: [14.42, 50.08] }, properties: { name: "Lokál", street: "Dlouhá", housenumber: "33", city: "Praha", country: "Česko" } },
      { geometry: { coordinates: [16.6, 49.19] }, properties: { street: "Masarykova", city: "Brno" } },
      { properties: { name: "bez souřadnic" } },
    ])).toEqual([
      { name: "Lokál", lat: 50.08, lng: 14.42, address: "Dlouhá 33, Praha, Česko" },
      { name: "Masarykova", lat: 49.19, lng: 16.6, address: "Brno" },
    ]);
  });

  it("navigace", () => {
    expect(navLinks({ lat: 50, lng: 14, name: "Lokál" }).apple).toBe("https://maps.apple.com/?daddr=50,14&q=Lok%C3%A1l");
  });
});
