// Počasí z Open-Meteo (zdarma, bez klíče). Pro střední Evropu vybírá nejlepší model sám
// („best_match“ = DWD ICON-D2 2 km / ICON-EU, dál ECMWF IFS).
import { useQuery } from "@tanstack/react-query";
import type { IconName } from "./icons";

export interface Place { lat: number; lng: number; name: string }

export interface Weather {
  temp: number;
  feels: number;
  code: number;
  isDay: boolean;
  wind: number;
  today: { max: number; min: number; rain: number; rainChance: number; sunrise: string; sunset: string };
  hours: { time: Date; temp: number; code: number; rainChance: number; isDay: boolean }[];
  days: { date: Date; max: number; min: number; code: number; rainChance: number }[];
}

/** WMO kód počasí → popis a ikona. */
export function describe(code: number, isDay = true): { text: string; icon: IconName } {
  if (code === 0) return { text: "Jasno", icon: isDay ? "w-sun" : "w-moon" };
  if (code <= 2) return { text: code === 1 ? "Skoro jasno" : "Polojasno", icon: isDay ? "w-partly" : "w-moon" };
  if (code === 3) return { text: "Zataženo", icon: "w-cloud" };
  if (code === 45 || code === 48) return { text: "Mlha", icon: "w-fog" };
  if (code >= 51 && code <= 57) return { text: "Mrholení", icon: "w-rain" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { text: code >= 80 ? "Přeháňky" : "Déšť", icon: "w-rain" };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { text: "Sněžení", icon: "w-snow" };
  if (code >= 95) return { text: "Bouřka", icon: "w-storm" };
  return { text: "Oblačno", icon: "w-cloud" };
}

// Tvar odpovědi Open-Meteo (jen pole, která používáme)
interface ApiResponse {
  current: { time: string; temperature_2m: number; apparent_temperature: number; weather_code: number; is_day: number; wind_speed_10m: number };
  hourly: { time: string[]; temperature_2m: number[]; weather_code: number[]; precipitation_probability: (number | null)[]; is_day: number[] };
  daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; weather_code: number[]; precipitation_sum: number[]; precipitation_probability_max: (number | null)[]; sunrise: string[]; sunset: string[] };
}

export function parseWeather(r: ApiResponse, hours = 12): Weather {
  const now = new Date(r.current.time);
  const start = Math.max(0, r.hourly.time.findIndex((t) => new Date(t) >= now));
  return {
    temp: r.current.temperature_2m,
    feels: r.current.apparent_temperature,
    code: r.current.weather_code,
    isDay: r.current.is_day === 1,
    wind: r.current.wind_speed_10m,
    today: {
      max: r.daily.temperature_2m_max[0], min: r.daily.temperature_2m_min[0], rain: r.daily.precipitation_sum[0],
      rainChance: r.daily.precipitation_probability_max[0] ?? 0, sunrise: r.daily.sunrise[0], sunset: r.daily.sunset[0],
    },
    hours: r.hourly.time.slice(start, start + hours).map((t, i) => ({
      time: new Date(t), temp: r.hourly.temperature_2m[start + i], code: r.hourly.weather_code[start + i],
      rainChance: r.hourly.precipitation_probability[start + i] ?? 0, isDay: r.hourly.is_day[start + i] === 1,
    })),
    days: r.daily.time.slice(1, 4).map((t, i) => ({
      date: new Date(`${t}T12:00:00`), max: r.daily.temperature_2m_max[i + 1], min: r.daily.temperature_2m_min[i + 1],
      code: r.daily.weather_code[i + 1], rainChance: r.daily.precipitation_probability_max[i + 1] ?? 0,
    })),
  };
}

export async function fetchWeather(p: Place): Promise<Weather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat.toFixed(3)}&longitude=${p.lng.toFixed(3)}`
    + "&current=temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m"
    + "&hourly=temperature_2m,weather_code,precipitation_probability,is_day"
    + "&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_probability_max,sunrise,sunset"
    + "&timezone=auto&forecast_days=4";
  const r = await fetch(url);
  if (!r.ok) throw new Error("Počasí se nepodařilo načíst");
  return parseWeather(await r.json());
}

export function useWeather(place: Place | null) {
  return useQuery({
    queryKey: ["weather", place?.lat, place?.lng],
    enabled: !!place,
    queryFn: () => fetchWeather(place!),
    staleTime: 20 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 1,
  });
}

/** Hledání města (geokódování Open-Meteo). */
export async function searchCity(q: string): Promise<Place[]> {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.trim())}&count=6&language=cs`);
  if (!r.ok) return [];
  const j = await r.json() as { results?: { latitude: number; longitude: number; name: string; admin1?: string; country_code?: string }[] };
  return (j.results ?? []).map((c) => ({ lat: c.latitude, lng: c.longitude, name: [c.name, c.admin1 && c.admin1 !== c.name ? c.admin1 : null].filter(Boolean).join(", ") }));
}

const KEY = "weather:place";
export function loadPlace(): Place | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "null") as Place | null;
    return p && Number.isFinite(p.lat) && Number.isFinite(p.lng) ? p : null;
  } catch {
    return null;
  }
}
export function savePlace(p: Place | null) {
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    // bez úložiště se místo jen nezapamatuje
  }
}
