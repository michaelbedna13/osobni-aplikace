import type { Beer } from "../modules/piva/data";
import type { Quote } from "../modules/hlaskomat/data";
import { namedayFor, type Person } from "../modules/lide/data";
import { stableId } from "./uuid";

/** Zálohy z původních appek (Piva: počty po dnech, Hláškomat: pole hlášek). */
export type Backup =
  | { kind: "piva"; days: { day: string; count: number }[]; total: number }
  | { kind: "hlasky"; quotes: OldQuote[] }
  | { kind: "lide"; people: PersonRow[] }
  | { kind: "unknown" };

interface OldQuote {
  id: string | number;
  text: string;
  author?: string | null;
  context?: string | null;
  date?: string;
  starred?: boolean;
}

/** Záloha lidí: { "kind": "lide", "people": [{ "name", "birth": "2001-11-12" | "11-12", "nameday"?, "note"? }] } */
interface PersonRow {
  name: string;
  birth?: string | null;
  nameday?: string | null;
  note?: string | null;
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
  if (isRecord(json) && json.kind === "lide" && Array.isArray(json.people)) {
    const people = json.people.filter((p): p is PersonRow => isRecord(p) && typeof p.name === "string" && p.name.trim() !== "");
    if (people.length) return { kind: "lide", people };
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

const BIRTH = /^(?:(\d{4})-)?(\d{2})-(\d{2})$/;
const MD = /^\d{2}-\d{2}$/;

/** Lidé ze zálohy; id podle jména, takže opakovaný import nikoho nezdvojí. Jmeniny: ze zálohy, jinak podle jména. */
export async function backupToPeople(rows: PersonRow[]): Promise<Person[]> {
  return Promise.all(rows.map(async (r) => {
    const name = r.name.trim();
    const m = typeof r.birth === "string" ? r.birth.trim().match(BIRTH) : null;
    const nameday = r.nameday === null ? null : typeof r.nameday === "string" && MD.test(r.nameday) ? r.nameday : namedayFor(name);
    return {
      id: await stableId(`clovek:${name.toLowerCase()}`),
      name,
      birth_year: m?.[1] ? Number(m[1]) : null,
      birth_month: m ? Number(m[2]) : null,
      birth_day: m ? Number(m[3]) : null,
      nameday,
      note: clean(r.note),
      created_at: new Date().toISOString(),
    };
  }));
}
