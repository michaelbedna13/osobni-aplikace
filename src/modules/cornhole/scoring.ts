// Počítání bodů v cornholu: deska = 1 bod, díra = 3 body, 4 pytlíky na tým a kolo.

export type Mode = "soucet" | "rozdil";
export interface Throw { board: number; hole: number }
export type Round = Throw[];

export const BAGS = 4;
export const MODE_NAMES: Record<Mode, string> = { soucet: "Sčítání", rozdil: "Rozdílem" };
export const MODE_HINTS: Record<Mode, string> = {
  soucet: "Každý tým si přičte, co hodil. Hodí se pro víc týmů.",
  rozdil: "Body se ruší: v kole boduje jen nejlepší tým, a to rozdílem oproti druhému.",
};

export const rawPoints = (t: Throw) => t.board + t.hole * 3;

/** Body, které si týmy v kole připíšou. */
export function roundScores(round: Round, mode: Mode): number[] {
  const raw = round.map(rawPoints);
  if (mode === "soucet") return raw;
  const sorted = [...raw].sort((a, b) => b - a);
  const [best, second = 0] = sorted;
  const leaders = raw.filter((p) => p === best).length;
  return raw.map((p) => (p === best && leaders === 1 ? best - second : 0));
}

/** Průběžné součty po každém kole: totals[kolo][tým]. */
export function runningTotals(rounds: Round[], mode: Mode, teams: number): number[][] {
  const out: number[][] = [];
  let current = Array<number>(teams).fill(0);
  for (const r of rounds) {
    const s = roundScores(r, mode);
    current = current.map((v, i) => v + (s[i] ?? 0));
    out.push(current);
  }
  return out;
}

export const totals = (rounds: Round[], mode: Mode, teams: number) =>
  runningTotals(rounds, mode, teams).at(-1) ?? Array<number>(teams).fill(0);

/**
 * Vítěz: tým, který po kole dosáhl cíle. Když ho dosáhne víc týmů najednou, vyhrává ten s víc body;
 * při shodě se hraje dál. Vrací index týmu, nebo null.
 */
export function winnerOf(rounds: Round[], mode: Mode, teams: number, target: number): number | null {
  for (const t of runningTotals(rounds, mode, teams)) {
    const over = t.map((v, i) => ({ v, i })).filter((x) => x.v >= target).sort((a, b) => b.v - a.v);
    if (over.length === 1 || (over.length > 1 && over[0].v > over[1].v)) return over[0].i;
  }
  return null;
}

/** Pořadí týmů podle bodů (indexy). */
export const standings = (scores: number[]) => scores.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).map((x) => x.i);
