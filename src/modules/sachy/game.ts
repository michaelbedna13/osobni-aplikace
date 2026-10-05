// Šachy pro dva na jednom telefonu: pravidla hlídá chess.js, tady jsou hodiny, výsledky a ukládání.
import { Chess, type Color, type PieceSymbol } from "chess.js";

export interface TimeControl {
  id: string;
  name: string;
  /** Základní čas v sekundách (0 = bez hodin). */
  base: number;
  /** Přídavek za tah v sekundách. */
  inc: number;
}

export const CONTROLS: TimeControl[] = [
  { id: "none", name: "Bez hodin", base: 0, inc: 0 },
  { id: "1+0", name: "Bullet 1 min", base: 60, inc: 0 },
  { id: "3+2", name: "Blitz 3+2", base: 180, inc: 2 },
  { id: "5+0", name: "Blitz 5 min", base: 300, inc: 0 },
  { id: "10+0", name: "Rapid 10 min", base: 600, inc: 0 },
  { id: "15+10", name: "Rapid 15+10", base: 900, inc: 10 },
];
export const controlById = (id: string) => CONTROLS.find((c) => c.id === id) ?? CONTROLS[0];

export type Layout = "stul" | "otacet";
export const LAYOUT_NAMES: Record<Layout, string> = { stul: "Přes stůl", otacet: "Otáčet desku" };
export const LAYOUT_HINTS: Record<Layout, string> = {
  stul: "Telefon leží mezi vámi, černý má svoje hodiny otočené k sobě.",
  otacet: "Telefon si podáváte, deska se po každém tahu otočí k tomu, kdo táhne.",
};

export type Reason = "mat" | "cas" | "vzdal" | "pat" | "dohoda" | "material" | "opakovani" | "padesat";

export interface Result {
  /** Vítěz, null = remíza. */
  winner: Color | null;
  reason: Reason;
}

export const REASON_TEXT: Record<Reason, string> = {
  mat: "šach mat",
  cas: "došel čas",
  vzdal: "soupeř vzdal",
  pat: "pat",
  dohoda: "remíza dohodou",
  material: "nedostatek materiálu",
  opakovani: "trojí opakování",
  padesat: "pravidlo 50 tahů",
};

export interface ChessGame {
  started_at: string;
  white: string;
  black: string;
  control: string;
  layout: Layout;
  /** Tahy v algebraickém zápisu (SAN). */
  moves: string[];
  /** Zbývající čas v ms [bílý, černý] k okamžiku runningSince. */
  clock: [number, number];
  /** Od kdy běží hodiny hráče na tahu (ms), null = stojí. */
  runningSince: number | null;
  paused: boolean;
  result: Result | null;
  /** Výsledek už je zapsaný v historii. */
  saved?: boolean;
}

const side = (c: Color) => (c === "w" ? 0 : 1);
export const turnOf = (moves: string[]): Color => (moves.length % 2 === 0 ? "w" : "b");
export const other = (c: Color): Color => (c === "w" ? "b" : "w");

export function newGame(white: string, black: string, control: string, layout: Layout): ChessGame {
  const ms = controlById(control).base * 1000;
  return { started_at: new Date().toISOString(), white, black, control, layout, moves: [], clock: [ms, ms], runningSince: null, paused: false, result: null };
}

export function replay(moves: string[]): Chess {
  const chess = new Chess();
  for (const m of moves) chess.move(m);
  return chess;
}

/** Zbývající čas obou hráčů v daném okamžiku. */
export function timeLeft(g: ChessGame, now: number): [number, number] {
  const out: [number, number] = [...g.clock];
  if (g.runningSince !== null && !g.result) out[side(turnOf(g.moves))] -= now - g.runningSince;
  return out;
}

const hasClock = (g: ChessGame) => controlById(g.control).base > 0;

/** Má hráč čím dát mat? (Při propadnutí času proti samotnému králi je remíza.) */
function canMate(chess: Chess, c: Color): boolean {
  const pieces = chess.board().flat().filter((p): p is NonNullable<typeof p> => !!p && p.color === c && p.type !== "k");
  return !(pieces.length === 0 || (pieces.length === 1 && (pieces[0].type === "n" || pieces[0].type === "b")));
}

/** Výsledek podle pozice (mat, pat, remízy), nebo null. */
export function positionResult(chess: Chess): Result | null {
  if (chess.isCheckmate()) return { winner: other(chess.turn()), reason: "mat" };
  if (chess.isStalemate()) return { winner: null, reason: "pat" };
  if (chess.isInsufficientMaterial()) return { winner: null, reason: "material" };
  if (chess.isThreefoldRepetition()) return { winner: null, reason: "opakovani" };
  if (chess.isDraw()) return { winner: null, reason: "padesat" };
  return null;
}

/**
 * Zahraje tah (SAN nebo {from,to,promotion}) a posune hodiny: hráči na tahu odečte čas, přidá přídavek
 * a spustí hodiny soupeři. Hodiny se rozběhnou až po prvním tahu bílého. Neplatný tah vrátí null.
 */
export function applyMove(g: ChessGame, move: string | { from: string; to: string; promotion?: string }, now: number): ChessGame | null {
  if (g.result) return null;
  const chess = replay(g.moves);
  let san: string;
  try {
    san = chess.move(move).san;
  } catch {
    return null;
  }
  const mover = turnOf(g.moves);
  const clock: [number, number] = [...g.clock];
  if (hasClock(g)) {
    if (g.runningSince !== null) clock[side(mover)] -= now - g.runningSince;
    if (g.moves.length > 0) clock[side(mover)] += controlById(g.control).inc * 1000;
  }
  return {
    ...g,
    moves: [...g.moves, san],
    clock,
    runningSince: hasClock(g) && !g.paused ? now : null,
    result: positionResult(chess),
  };
}

/** Vrátí poslední tah (čas se nevrací, hodiny běží dál hráči, který je znovu na tahu). */
export function undoMove(g: ChessGame, now: number): ChessGame {
  if (!g.moves.length) return g;
  const clock = timeLeft(g, now);
  const moves = g.moves.slice(0, -1);
  return { ...g, moves, clock, result: null, runningSince: hasClock(g) && !g.paused && moves.length > 0 ? now : null };
}

/** Došel hráči na tahu čas? Vrátí hru s výsledkem, jinak null. */
export function checkFlag(g: ChessGame, now: number): ChessGame | null {
  if (g.result || !hasClock(g) || g.runningSince === null) return null;
  const mover = turnOf(g.moves);
  const left = timeLeft(g, now);
  if (left[side(mover)] > 0) return null;
  const clock: [number, number] = [...left];
  clock[side(mover)] = 0;
  const winner = canMate(replay(g.moves), other(mover)) ? other(mover) : null;
  return { ...g, clock, runningSince: null, result: { winner, reason: winner ? "cas" : "material" } };
}

export function pause(g: ChessGame, now: number): ChessGame {
  if (g.paused || g.result) return g;
  return { ...g, clock: timeLeft(g, now), runningSince: null, paused: true };
}

export function resume(g: ChessGame, now: number): ChessGame {
  if (!g.paused) return g;
  return { ...g, paused: false, runningSince: hasClock(g) && g.moves.length > 0 ? now : null };
}

export function finish(g: ChessGame, result: Result, now: number): ChessGame {
  return { ...g, clock: timeLeft(g, now), runningSince: null, result };
}

/** „4:05“, pod 10 s s desetinami „7,3“. */
export function formatClock(ms: number): string {
  const t = Math.max(0, ms);
  if (t < 10_000) return (Math.floor(t / 100) / 10).toFixed(1).replace(".", ",");
  const s = Math.ceil(t / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const VALUES: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Sebrané figury (kým) a materiálová převaha bílého (počítá i proměny pěšců). */
export function captures(chess: Chess): { byWhite: PieceSymbol[]; byBlack: PieceSymbol[]; balance: number } {
  const byWhite: PieceSymbol[] = [];
  const byBlack: PieceSymbol[] = [];
  let promo = 0;
  for (const m of chess.history({ verbose: true })) {
    if (m.captured) (m.color === "w" ? byWhite : byBlack).push(m.captured);
    if (m.promotion) promo += (m.color === "w" ? 1 : -1) * (VALUES[m.promotion as PieceSymbol] - 1);
  }
  const order = (a: PieceSymbol, b: PieceSymbol) => VALUES[b] - VALUES[a];
  const sum = (l: PieceSymbol[]) => l.reduce((s, p) => s + VALUES[p], 0);
  return { byWhite: byWhite.sort(order), byBlack: byBlack.sort(order), balance: sum(byWhite) - sum(byBlack) + promo };
}

/* ---------- historie partií (jen v tomto zařízení) ---------- */

export interface ChessRecord {
  date: string;
  white: string;
  black: string;
  control: string;
  winner: Color | null;
  reason: Reason;
  moves: number;
  pgn: string;
}

const HISTORY_KEY = "sachy:partie";

export function loadHistory(): ChessRecord[] {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as ChessRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveRecord(g: ChessGame) {
  if (!g.result) return;
  const chess = replay(g.moves);
  chess.setHeader("White", g.white);
  chess.setHeader("Black", g.black);
  chess.setHeader("Date", g.started_at.slice(0, 10).replaceAll("-", "."));
  const rec: ChessRecord = {
    date: g.started_at, white: g.white, black: g.black, control: g.control, winner: g.result.winner, reason: g.result.reason,
    moves: Math.ceil(g.moves.length / 2), pgn: chess.pgn(),
  };
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify([rec, ...loadHistory()].slice(0, 300)));
  } catch {
    // plné úložiště – partie se jen neuloží do historie
  }
}

const key = (n: string) => n.trim().toLocaleLowerCase("cs");

/** Bilance dvou hráčů bez ohledu na barvu: [výhry a, výhry b, remízy]. */
export function headToHead(list: ChessRecord[], a: string, b: string): [number, number, number] {
  const out: [number, number, number] = [0, 0, 0];
  for (const r of list) {
    const names = [key(r.white), key(r.black)];
    if (!names.includes(key(a)) || !names.includes(key(b)) || key(a) === key(b)) continue;
    if (r.winner === null) out[2]++;
    else {
      const w = key(r.winner === "w" ? r.white : r.black);
      if (w === key(a)) out[0]++;
      else out[1]++;
    }
  }
  return out;
}
