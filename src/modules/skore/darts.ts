// Šipky: pravidla počítání (301/501/701, zavírání libovolně / na double / master), legy
// a návrh, co hodit na zavření. Hra je seznam náhozů; stav se z nich vždy spočítá znovu.

export type OutMode = "straight" | "double" | "master";

export interface DartSettings {
  start: number;
  out: OutMode;
  /** Kolik vítězných legů je potřeba na výhru (1 = jeden leg). */
  legs: number;
}

/**
 * Šipka jako kód: S1–S20 (jednička), D1–D20 (double), T1–T20 (triple), SB = 25, DB = bull (50), M = vedle.
 */
export type Dart = string;

export interface Visit {
  /** Index hráče. */
  p: number;
  /** Body náhozu (součet tří šipek). */
  v: number;
  /** Zadáno po šipkách. */
  darts?: Dart[];
  /** Zadáno součtem: hráč potvrdil, že zavřel správně (double / master). */
  ok?: boolean;
}

export const DEFAULT_SETTINGS: DartSettings = { start: 501, out: "double", legs: 1 };
export const STARTS = [301, 501, 701];
export const LEG_OPTIONS = [1, 2, 3, 5];
export const OUT_NAMES: Record<OutMode, string> = { straight: "Libovolně", double: "Na double", master: "Master" };
export const OUT_HINTS: Record<OutMode, string> = {
  straight: "Na nulu se dá dojít jakoukoli šipkou.",
  double: "Poslední šipka musí trefit double nebo bull. Zbyde-li 1, je to přehoz.",
  master: "Poslední šipka musí trefit double, triple nebo bull.",
};

/** Body, kterých se jedním náhozem (3 šipky) dosáhnout nedá. */
const IMPOSSIBLE = new Set([163, 166, 169, 172, 173, 175, 176, 178, 179]);
export const possibleVisit = (v: number) => Number.isInteger(v) && v >= 0 && v <= 180 && !IMPOSSIBLE.has(v);

export function dartValue(d: Dart): number {
  if (d === "M") return 0;
  if (d === "SB") return 25;
  if (d === "DB") return 50;
  const n = Number(d.slice(1));
  return d[0] === "T" ? n * 3 : d[0] === "D" ? n * 2 : n;
}

const isDouble = (d: Dart) => d.startsWith("D");
const isTriple = (d: Dart) => d.startsWith("T");

export function dartLabel(d: Dart): string {
  if (d === "M") return "0";
  if (d === "SB") return "25";
  if (d === "DB") return "Bull";
  return d[0] === "S" ? d.slice(1) : d;
}

/** Dá se tímhle zavřít (dojít na nulu) podle pravidla? */
const finishes = (d: Dart, out: OutMode) => (out === "straight" ? dartValue(d) > 0 : out === "double" ? isDouble(d) : isDouble(d) || isTriple(d));

export interface VisitInfo extends Visit {
  leg: number;
  before: number;
  after: number;
  bust: boolean;
  /** Nához zavřel leg. */
  checkout: boolean;
}

export interface DartState {
  /** Zbývá v aktuálním legu. */
  scores: number[];
  legsWon: number[];
  leg: number;
  /** Kdo začínal aktuální leg. */
  legStarter: number;
  current: number | null;
  winner: number | null;
  log: VisitInfo[];
}

/** Platné zavření posledního náhozu (u šipek podle poslední šipky, u součtu podle potvrzení). */
function closedRight(t: Visit, out: OutMode): boolean {
  if (out === "straight") return true;
  if (t.darts?.length) {
    const last = [...t.darts].reverse().find((d) => d !== "M");
    return !!last && finishes(last, out);
  }
  return t.ok === true;
}

export function play(settings: DartSettings, players: number, visits: Visit[]): DartState {
  const n = Math.max(1, players);
  const { start, out } = settings;
  let scores = Array<number>(n).fill(start);
  const legsWon = Array<number>(n).fill(0);
  const log: VisitInfo[] = [];
  let leg = 0;
  let inLeg = 0;
  let winner: number | null = null;

  for (const t of visits) {
    if (winner !== null || t.p < 0 || t.p >= n) break;
    const before = scores[t.p];
    const raw = before - t.v;
    const bust = raw < 0 || (out !== "straight" && raw === 1) || (raw === 0 && !closedRight(t, out));
    const after = bust ? before : raw;
    const checkout = !bust && after === 0;
    log.push({ ...t, leg, before, after, bust, checkout });
    scores[t.p] = after;
    inLeg++;
    if (checkout) {
      legsWon[t.p]++;
      if (legsWon[t.p] >= settings.legs) winner = t.p;
      else {
        leg++;
        inLeg = 0;
        scores = Array<number>(n).fill(start);
      }
    }
  }

  const legStarter = leg % n;
  return { scores, legsWon, leg, legStarter, current: winner === null ? (legStarter + inLeg) % n : null, winner, log };
}

/** Průměr na nához (3 šipky) za celý zápas, přehozy jako 0. */
export function average(state: DartState, p: number): number | null {
  const mine = state.log.filter((t) => t.p === p);
  if (!mine.length) return null;
  const sum = mine.reduce((s, t) => s + (t.bust ? 0 : t.v), 0);
  return Math.round((sum / mine.length) * 10) / 10;
}

/* ---------- návrh zavření ---------- */

const SINGLES: Dart[] = [...Array.from({ length: 20 }, (_, i) => `S${20 - i}`), "SB"];
const DOUBLES: Dart[] = [...Array.from({ length: 20 }, (_, i) => `D${20 - i}`), "DB"];
const TRIPLES: Dart[] = Array.from({ length: 20 }, (_, i) => `T${20 - i}`);
const SETUP: Dart[] = [...TRIPLES, ...SINGLES, ...DOUBLES];
/** Oblíbené doubly (dobře se na ně hází a půlí se: 40 → 20 → 10 → 5). */
const DOUBLE_PREF = ["D20", "D16", "D18", "D10", "D12", "D8", "D14", "D6", "D4", "D2", "D19", "D17", "D15", "D13", "D11", "D9", "D7", "D5", "D3", "D1", "DB"];

/** Jak těžká je šipka na přípravu (menší = lepší). */
function setupCost(d: Dart): number {
  if (d === "SB") return 4;
  if (d === "DB") return 6;
  const n = Number(d.slice(1));
  if (d[0] === "S") return 0.5 + (20 - n) * 0.01;
  if (d[0] === "T") return n >= 15 ? 1 + (20 - n) * 0.12 : 2.5 + (15 - n) * 0.05;
  return 5;
}

function finishCost(d: Dart, out: OutMode): number {
  if (out === "straight") return isDouble(d) ? 2 : isTriple(d) ? 1 : 0;
  if (isDouble(d)) return DOUBLE_PREF.indexOf(d) * 0.15;
  return 3 + setupCost(d);
}

const cache = new Map<string, Dart[] | null>();

/**
 * Nejjednodušší cesta na zavření se zbývajícími šipkami, nebo null (nejde / příliš vysoko).
 * Např. 170 na double → ["T20", "T20", "DB"].
 */
export function checkout(rest: number, dartsLeft: number, out: OutMode): Dart[] | null {
  if (rest <= 0 || rest > 180 || dartsLeft < 1) return null;
  const key = `${rest}|${dartsLeft}|${out}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  const finishers = [...SINGLES, ...DOUBLES, ...TRIPLES].filter((d) => finishes(d, out));
  const finishBy = new Map<number, Dart[]>();
  for (const d of finishers) finishBy.set(dartValue(d), [...(finishBy.get(dartValue(d)) ?? []), d]);
  const bestFinish = (v: number) => (finishBy.get(v) ?? []).reduce<Dart | null>((b, d) => (b === null || finishCost(d, out) < finishCost(b, out) ? d : b), null);

  let best: { darts: Dart[]; cost: number } | null = null;
  const consider = (darts: Dart[]) => {
    const cost = darts.length * 100 + darts.slice(0, -1).reduce((s, d) => s + setupCost(d), 0) + finishCost(darts[darts.length - 1], out);
    if (!best || cost < best.cost) best = { darts, cost };
  };
  for (let k = 1; k <= Math.min(3, dartsLeft) && !best; k++) {
    if (k === 1) {
      const f = bestFinish(rest);
      if (f) consider([f]);
    } else if (k === 2) {
      for (const a of SETUP) {
        const f = bestFinish(rest - dartValue(a));
        if (f) consider([a, f]);
      }
    } else {
      for (const a of SETUP) for (const b of SETUP) {
        if (dartValue(b) > dartValue(a)) continue; // pořadí přípravy nehraje roli, nejdřív vyšší
        const f = bestFinish(rest - dartValue(a) - dartValue(b));
        if (f) consider([a, b, f]);
      }
    }
  }
  const result = best ? (best as { darts: Dart[] }).darts : null;
  cache.set(key, result);
  return result;
}

export const checkoutText = (darts: Dart[] | null) => (darts ? darts.map(dartLabel).join(" · ") : "");

export const settingsLabel = (s: DartSettings) =>
  [String(s.start), s.out === "double" ? "double out" : s.out === "master" ? "master out" : null, s.legs > 1 ? `na ${s.legs} legy` : null].filter(Boolean).join(" · ");

/** Pořadí hráčů: vítěz, pak víc legů, pak méně zbývá. */
export function ranking(state: DartState): number[] {
  return state.scores
    .map((v, i) => ({ v, i }))
    .sort((a, b) => {
      if (a.i === state.winner) return -1;
      if (b.i === state.winner) return 1;
      return state.legsWon[b.i] - state.legsWon[a.i] || a.v - b.v;
    })
    .map((x) => x.i);
}
