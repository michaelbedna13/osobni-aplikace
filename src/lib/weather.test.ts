import { describe as group, expect, it } from "vitest";
import { describe, parseWeather } from "./weather";

group("počasí", () => {
  it("popis podle kódu WMO", () => {
    expect(describe(0)).toEqual({ text: "Jasno", icon: "w-sun" });
    expect(describe(0, false).icon).toBe("w-moon");
    expect(describe(63).text).toBe("Déšť");
    expect(describe(81).text).toBe("Přeháňky");
    expect(describe(95).icon).toBe("w-storm");
  });

  it("převod odpovědi Open-Meteo", () => {
    const hours = Array.from({ length: 30 }, (_, i) => `2026-10-03T${String(i % 24).padStart(2, "0")}:00`);
    const w = parseWeather({
      current: { time: "2026-10-03T14:15", temperature_2m: 15.3, apparent_temperature: 13.9, weather_code: 2, is_day: 1, wind_speed_10m: 12 },
      hourly: { time: hours, temperature_2m: hours.map((_, i) => i), weather_code: hours.map(() => 3), precipitation_probability: hours.map(() => 20), is_day: hours.map(() => 1) },
      daily: { time: ["2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06"], temperature_2m_max: [17, 18, 12, 14], temperature_2m_min: [8, 9, 6, 7], weather_code: [2, 61, 3, 0], precipitation_sum: [0, 4.2, 0.1, 0], precipitation_probability_max: [10, 80, null, 5], sunrise: ["2026-10-03T07:05", "", "", ""], sunset: ["2026-10-03T18:35", "", "", ""] },
    }, 4);
    expect(w.temp).toBe(15.3);
    expect(w.hours.map((h) => h.temp)).toEqual([15, 16, 17, 18]);
    expect(w.days).toHaveLength(3);
    expect(w.days[1].rainChance).toBe(0);
    expect(w.today.max).toBe(17);
  });
});
