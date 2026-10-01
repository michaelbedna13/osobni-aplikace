// Práce s datem v místním čase. Týden začíná pondělím.

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfWeek(d: Date) {
  const day = startOfDay(d);
  const fromMonday = (day.getDay() + 6) % 7;
  return addDays(day, -fromMonday);
}

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const startOfYear = (d: Date) => new Date(d.getFullYear(), 0, 1);

export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

export const WEEKDAYS_SHORT = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

const time = (d: Date) => d.toLocaleTimeString("cs-CZ", { hour: "numeric", minute: "2-digit" });

/** „Dnes 19:40“, „Včera 21:10“, „Út 21:10“, „12. 9. 21:10“, „12. 9. 2025“ */
export function relativeTime(date: Date, now = new Date()) {
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (days === 0) return `Dnes ${time(date)}`;
  if (days === 1) return `Včera ${time(date)}`;
  if (days > 1 && days < 7) return `${WEEKDAYS_SHORT[(date.getDay() + 6) % 7]} ${time(date)}`;
  if (date.getFullYear() === now.getFullYear()) return `${date.getDate()}. ${date.getMonth() + 1}. ${time(date)}`;
  return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
}

/** Hodnota pro <input type="datetime-local"> v místním čase. */
export function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
