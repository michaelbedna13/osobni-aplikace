// Hra pro 2–6 hráčů na jednom telefonu: rozehraná hra a výsledky se drží jen v tomto zařízení.
import { roundScores, type Mode, type Round } from "./scoring";
import { WIND_LEVELS, type Bag, type Player } from "./sim";

export interface MobileMatch {
  names: string[];
  colors: string[];
  /** Starší uložené hry tohle pole nemají – hrály se rozdílem. */
  mode?: Mode;
  target: number;
  wind: boolean;
  rounds: Round[];
  starter: Player;
  bags: Bag[];
  thrown: number;
  /** Vítr v kole: znaménko = směr, velikost = stupeň 0–3. */
  windLevel: number;
  lastPower: (number | null)[];
  started_at: string;
}

export interface MobileResult {
  date: string;
  names: string[];
  scores: number[];
  winner: Player;
}

export interface MobileSetup {
  names: string[];
  colors: string[];
  mode: Mode;
  target: number;
  wind: boolean;
}

const GAME_KEY = "cornhole-mobil:hra";
const RESULTS_KEY = "cornhole-mobil:vysledky";
const SETUP_KEY = "cornhole-mobil:nastaveni";

export const DEFAULT_SETUP: MobileSetup = { names: ["Hráč 1", "Hráč 2"], colors: ["#E43B44", "#0099DB"], mode: "rozdil", target: 21, wind: true };

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
    names: setup.names, colors: setup.colors, mode: setup.mode, target: setup.target, wind: setup.wind,
    rounds: [], starter, bags: [], thrown: 0, windLevel: rollWind(setup.wind, rnd), lastPower: setup.names.map(() => null),
    started_at: new Date().toISOString(),
  };
}

export const modeOf = (m: MobileMatch): Mode => m.mode ?? "rozdil";

/** Kdo začíná další kolo: jediný nejlepší hráč kola, jinak ten, kdo začínal. */
export function nextStarter(round: Round, mode: Mode, starter: Player): Player {
  const gained = roundScores(round, mode);
  const best = Math.max(...gained);
  return best > 0 && gained.filter((v) => v === best).length === 1 ? gained.indexOf(best) : starter;
}

const key = (n: string) => n.trim().toLocaleLowerCase("cs");

/** Výhry každého z hráčů v předchozích hrách přesně téže party (na pořadí ani velikosti písmen nezáleží). */
export function headToHead(results: MobileResult[], names: string[]): number[] {
  const party = names.map(key).sort().join("|");
  const out = names.map(() => 0);
  for (const r of results) {
    if (r.names.map(key).sort().join("|") !== party) continue;
    const i = names.findIndex((n) => key(n) === key(r.names[r.winner]));
    if (i >= 0) out[i]++;
  }
  return out;
}
