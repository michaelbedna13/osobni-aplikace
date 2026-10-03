// Pravidla počítání pro různé hry. Hra je jen seznam zápisů (kdo, kolik bodů);
// stav (skóre, kdo je na řadě, vítěz) se z nich vždy spočítá znovu.

export type GameKind = "sipky" | "molkky" | "petanque" | "vlastni";

export interface Settings {
  /** Šipky: odkud se odečítá (501 / 301). */
  start?: number;
  /** Pétanque a vlastní hra: cíl. Vlastní hra může být bez cíle (null). */
  target?: number | null;
  /** Vlastní hra: vyhrává nejméně bodů (cíl pak hru ukončí). */
  lowWins?: boolean;
}

export interface Turn {
  /** Index hráče. */
  p: number;
  /** Body zápisu (u šipek nához, u mölkky hod). */
  v: number;
}

export interface KindDef {
  name: string;
  hint: string;
  defaults: Settings;
  /** Hráči se střídají v pevném pořadí (u pétanque zapisuješ jen tým, který bodoval). */
  ordered: boolean;
}

export const KINDS: Record<GameKind, KindDef> = {
  sipky: {
    name: "Šipky",
    hint: "Odečítá se od 501 nebo 301. Kdo přesně dojde na nulu, vyhrává. Přehoz se nepočítá.",
    defaults: { start: 501 },
    ordered: true,
  },
  molkky: {
    name: "Mölkky",
    hint: "Na přesně 50 bodů. Kdo přehodí, spadne na 25. Tři nuly za sebou a končíš.",
    defaults: {},
    ordered: true,
  },
  petanque: {
    name: "Pétanque",
    hint: "V kole boduje jen jeden tým, 1 až 6 bodů. Hraje se do 13.",
    defaults: { target: 13 },
    ordered: false,
  },
  vlastni: {
    name: "Vlastní hra",
    hint: "Karty, kostky, kubb, cokoli. Každé kolo zapíšeš body všem.",
    defaults: { target: null, lowWins: false },
    ordered: true,
  },
};

export const KIND_ORDER: GameKind[] = ["sipky", "molkky", "petanque", "vlastni"];
export const MOLKKY_TARGET = 50;
export const MOLKKY_RESET = 25;
export const DART_MAX = 180;

export interface TurnInfo extends Turn {
  before: number;
  after: number;
  /** Šipky: přehoz, nához se nepočítá. */
  bust?: boolean;
  /** Mölkky: přes 50, skóre spadlo na 25. */
  reset?: boolean;
  /** Mölkky: třetí nula v řadě, hráč končí. */
  out?: boolean;
}

export interface GameState {
  scores: number[];
  /** Mölkky: vypadlí hráči. */
  out: boolean[];
  /** Mölkky: nuly v řadě. */
  misses: number[];
  /** Kdo je na řadě (null u pétanque nebo po konci hry). */
  current: number | null;
  winner: number | null;
  log: TurnInfo[];
  /** Vlastní hra: kolik kol je dohraných celých. */
  rounds: number;
}

/** Jediný nejlepší index podle porovnání, při shodě null. */
function uniqueBest(values: number[], better: (a: number, b: number) => boolean, among: number[]): number | null {
  let best: number | null = null;
  let tie = false;
  for (const i of among) {
    if (best === null || better(values[i], values[best])) {
      best = i;
      tie = false;
    } else if (values[i] === values[best]) tie = true;
  }
  return tie ? null : best;
}

/**
 * Spočítá stav hry. `finished` = vlastní hru ukončil hráč ručně
 * (vyhrává nejlepší skóre, při shodě nikdo).
 */
export function play(kind: GameKind, settings: Settings, players: number, turns: Turn[], finished = false): GameState {
  const n = Math.max(1, players);
  const start = kind === "sipky" ? settings.start ?? 501 : 0;
  const scores = Array<number>(n).fill(start);
  const out = Array<boolean>(n).fill(false);
  const misses = Array<number>(n).fill(0);
  const log: TurnInfo[] = [];
  let winner: number | null = null;

  for (const t of turns) {
    if (winner !== null || t.p < 0 || t.p >= n) break;
    const before = scores[t.p];
    const info: TurnInfo = { ...t, before, after: before };
    if (kind === "sipky") {
      const after = before - t.v;
      if (after < 0) info.bust = true;
      else {
        info.after = after;
        if (after === 0) winner = t.p;
      }
    } else if (kind === "molkky") {
      if (t.v === 0) {
        misses[t.p]++;
        if (misses[t.p] >= 3) {
          out[t.p] = true;
          info.out = true;
        }
      } else {
        misses[t.p] = 0;
        let after = before + t.v;
        if (after > MOLKKY_TARGET) {
          after = MOLKKY_RESET;
          info.reset = true;
        }
        info.after = after;
        if (after === MOLKKY_TARGET) winner = t.p;
      }
      const alive = out.map((o, i) => (o ? -1 : i)).filter((i) => i >= 0);
      if (winner === null && n > 1 && alive.length === 1) winner = alive[0];
    } else {
      info.after = before + t.v;
    }
    scores[t.p] = info.after;
    log.push(info);
    if (kind === "petanque" && info.after >= (settings.target ?? 13)) winner = t.p;
  }

  const rounds = kind === "vlastni" ? Math.floor(log.length / n) : 0;
  const all = scores.map((_, i) => i);
  if (kind === "vlastni" && winner === null) {
    const low = !!settings.lowWins;
    const better = low ? (a: number, b: number) => a < b : (a: number, b: number) => a > b;
    const roundDone = log.length > 0 && log.length % n === 0;
    const target = settings.target ?? null;
    if (finished) winner = uniqueBest(scores, better, all);
    else if (target !== null && roundDone) {
      const reached = all.filter((i) => scores[i] >= target);
      // s cílem „nejméně bodů“ hru ukončí ten, kdo cíl překročí, vyhrává nejnižší skóre
      if (reached.length) winner = uniqueBest(scores, better, low ? all : reached);
    }
  }

  let current: number | null = null;
  if (winner === null && KINDS[kind].ordered) {
    const last = log.at(-1)?.p ?? -1;
    for (let k = 1; k <= n; k++) {
      const i = (last + k) % n;
      if (!out[i]) {
        current = i;
        break;
      }
    }
    // vlastní hra jde vždy po kolech v pevném pořadí
    if (kind === "vlastni") current = log.length % n;
  }

  return { scores, out, misses, current, winner, log, rounds };
}

/** Pořadí hráčů od nejlepšího (šipky a „nejméně bodů“ = nižší je lepší). */
export function ranking(kind: GameKind, settings: Settings, state: GameState): number[] {
  const low = kind === "sipky" || (kind === "vlastni" && !!settings.lowWins);
  return state.scores
    .map((v, i) => ({ v, i }))
    .sort((a, b) => {
      if (a.i === state.winner) return -1;
      if (b.i === state.winner) return 1;
      if (state.out[a.i] !== state.out[b.i]) return state.out[a.i] ? 1 : -1;
      return low ? a.v - b.v : b.v - a.v;
    })
    .map((x) => x.i);
}

/** Šipky: průměr na nához (3 šipky). */
export function dartAverage(state: GameState, p: number): number | null {
  const mine = state.log.filter((t) => t.p === p);
  if (!mine.length) return null;
  const sum = mine.reduce((s, t) => s + (t.bust ? 0 : t.v), 0);
  return Math.round((sum / mine.length) * 10) / 10;
}

/** Krátký popis nastavení, např. „501“ nebo „do 13“. */
export function settingsLabel(kind: GameKind, s: Settings): string {
  if (kind === "sipky") return String(s.start ?? 501);
  if (kind === "molkky") return `na ${MOLKKY_TARGET}`;
  if (kind === "petanque") return `do ${s.target ?? 13}`;
  const goal = s.target ? (s.lowWins ? `konec na ${s.target}` : `do ${s.target}`) : "bez cíle";
  return s.lowWins ? `${goal}, vyhrává nejméně` : goal;
}
