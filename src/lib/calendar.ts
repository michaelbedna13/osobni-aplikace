// Kalendář: jmeniny (český občanský kalendář) a státní svátky ČR.
import { getNameDay } from "namedays-cs";
import { addDays } from "./dates";

/** Velikonoční neděle (gregoriánský kalendář, anonymní algoritmus). */
export function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const FIXED: Record<string, string> = {
  "1-1": "Nový rok",
  "5-1": "Svátek práce",
  "5-8": "Den vítězství",
  "7-5": "Cyril a Metoděj",
  "7-6": "Upálení mistra Jana Husa",
  "9-28": "Den české státnosti",
  "10-28": "Vznik Československa",
  "11-17": "Den boje za svobodu a demokracii",
  "12-24": "Štědrý den",
  "12-25": "1. svátek vánoční",
  "12-26": "2. svátek vánoční",
};

/** Název státního svátku, nebo null. */
export function publicHoliday(date: Date): string | null {
  const fixed = FIXED[`${date.getMonth() + 1}-${date.getDate()}`];
  if (fixed) return fixed;
  const easter = easterSunday(date.getFullYear());
  const same = (d: Date) => d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
  if (same(addDays(easter, -2))) return "Velký pátek";
  if (same(addDays(easter, 1))) return "Velikonoční pondělí";
  return null;
}

/** Kdo má svátek: „Olívie a Oliver“, „Kašpar, Melichar a Baltazar“; nikdo → null. */
export function nameDay(date: Date): string | null {
  const names = getNameDay(date);
  if (names.length === 0) return null;
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} a ${names[names.length - 1]}`;
}
