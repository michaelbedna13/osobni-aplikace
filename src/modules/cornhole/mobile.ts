// Hra pro dva na jednom telefonu: rozehraná hra a výsledky se drží jen v tomto zařízení.
import { type Round } from "./scoring";
import { WIND_LEVELS, type Bag, type Player } from "./sim";

export interface MobileMatch {
  names: [string, string];
  colors: [string, string];
  target: number;
  wind: boolean;
  rounds: Round[];
  starter: Player;
  bags: Bag[];
  thrown: number;
  /** Vítr v kole: znaménko = směr, velikost = stupeň 0–3. */
  windLevel: number;
  lastPower: [number | null, number | null];
  started_at: string;
}

export interface MobileResult {
  date: string;
  names: [string, string];
  scores: [number, number];
  winner: Player;
}

export interface MobileSetup {
  names: [string, string];
  colors: [string, string];
  target: number;
  wind: boolean;
}

const GAME_KEY = "cornhole-mobil:hra";
const RESULTS_KEY = "cornhole-mobil:vysledky";
const SETUP_KEY = "cornhole-mobil:nastaveni";

export const DEFAULT_SETUP: MobileSetup = { names: ["Hráč 1", "Hráč 2"], colors: ["#E43B44", "#0099DB"], target: 21, wind: true };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // plné nebo zakázané úložiště – hra jede dál, jen se neuloží
  }
}

export const loadMatch = () => read<MobileMatch>(GAME_KEY);
export const saveMatch = (m: MobileMatch | null) => write(GAME_KEY, m);
export const loadSetup = () => ({ ...DEFAULT_SETUP, ...read<MobileSetup>(SETUP_KEY) });
export const saveSetup = (s: MobileSetup) => write(SETUP_KEY, s);
export const loadResults = () => read<MobileResult[]>(RESULTS_KEY) ?? [];
export const addResult = (r: MobileResult) => write(RESULTS_KEY, [r, ...loadResults()].slice(0, 200));

export function rollWind(enabled: boolean, rnd: () => number = Math.random): number {
  if (!enabled) return 0;
  const level = Math.min(WIND_LEVELS.length - 1, Math.floor(rnd() * WIND_LEVELS.length));
  return rnd() < 0.5 ? -level : level;
}

export const windForce = (level: number) => Math.sign(level) * WIND_LEVELS[Math.abs(level)];

export function newMatch(setup: MobileSetup, starter: Player = 0, rnd: () => number = Math.random): MobileMatch {
  return {
    names: setup.names, colors: setup.colors, target: setup.target, wind: setup.wind,
    rounds: [], starter, bags: [], thrown: 0, windLevel: rollWind(setup.wind, rnd), lastPower: [null, null],
    started_at: new Date().toISOString(),
  };
}

const same = (a: string, b: string) => a.trim().toLocaleLowerCase("cs") === b.trim().toLocaleLowerCase("cs");

/** Vzájemná bilance dvou hráčů (výhry prvního, výhry druhého), bez ohledu na pořadí. */
export function headToHead(results: MobileResult[], names: [string, string]): [number, number] {
  const out: [number, number] = [0, 0];
  for (const r of results) {
    const winner = r.names[r.winner];
    const loser = r.names[1 - r.winner];
    if (same(winner, names[0]) && same(loser, names[1])) out[0]++;
    else if (same(winner, names[1]) && same(loser, names[0])) out[1]++;
  }
  return out;
}
