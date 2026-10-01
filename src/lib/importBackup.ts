import type { Beer } from "../modules/piva/data";
import type { Quote } from "../modules/hlaskomat/data";
import { stableId } from "./uuid";

/** Zálohy z původních appek (Piva: počty po dnech, Hláškomat: pole hlášek). */
export type Backup =
  | { kind: "piva"; days: { day: string; count: number }[]; total: number }
  | { kind: "hlasky"; quotes: OldQuote[] }
  | { kind: "unknown" };

interface OldQuote {
  id: string | number;
  text: string;
  author?: string | null;
  context?: string | null;
  date?: string;
  starred?: boolean;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function parseBackup(json: unknown): Backup {
  if (isRecord(json) && isRecord(json.log)) {
    const days = Object.entries(json.log)
      .filter((e): e is [string, number] => DAY.test(e[0]) && typeof e[1] === "number" && Number.isInteger(e[1]) && e[1] > 0)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day));
    if (days.length) return { kind: "piva", days, total: days.reduce((sum, d) => sum + d.count, 0) };
  }
  if (Array.isArray(json)) {
    const quotes = json.filter(
      (q): q is OldQuote => isRecord(q) && typeof q.text === "string" && q.text.trim() !== "" && (typeof q.id === "string" || typeof q.id === "number"),
    );
    if (quotes.length) return { kind: "hlasky", quotes };
  }
  return { kind: "unknown" };
}

/** Každé pivo z daného dne dostane čas 20:00 (+ minuta za každé další), v místním čase. */
export async function backupToBeers(days: { day: string; count: number }[]): Promise<Beer[]> {
  const beers: Beer[] = [];
  for (const { day, count } of days) {
    const [y, m, d] = day.split("-").map(Number);
    for (let i = 0; i < count; i++) {
      beers.push({ id: await stableId(`piva:${day}:${i}`), drunk_at: new Date(y, m - 1, d, 20, i).toISOString() });
    }
  }
  return beers;
}

const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export async function backupToQuotes(quotes: OldQuote[]): Promise<Quote[]> {
  return Promise.all(
    quotes.map(async (q) => {
      const date = q.date ? new Date(q.date) : new Date(Number(q.id));
      return {
        id: await stableId(`hlaska:${q.id}`),
        text: q.text.trim(),
        author: clean(q.author),
        context: clean(q.context),
        said_at: (Number.isNaN(date.getTime()) ? new Date() : date).toISOString(),
        starred: q.starred === true,
      };
    }),
  );
}
