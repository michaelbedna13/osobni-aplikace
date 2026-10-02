// Rozehraná hra: drží se v localStorage, takže přežije zavření appky.
import { useCallback, useSyncExternalStore } from "react";
import type { GameTeam } from "./data";
import type { Mode, Round } from "./scoring";

export interface ActiveGame {
  started_at: string;
  mode: Mode;
  target: number;
  teams: GameTeam[];
  rounds: Round[];
}

const KEY = "cornhole:active";
const listeners = new Set<() => void>();
let cache: ActiveGame | null | undefined;

function read(): ActiveGame | null {
  if (cache !== undefined) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null") as ActiveGame | null;
    cache = parsed && Array.isArray(parsed.teams) && Array.isArray(parsed.rounds) ? parsed : null;
  } catch {
    cache = null;
  }
  return cache;
}

function write(next: ActiveGame | null) {
  cache = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // bez úložiště hra vydrží jen do zavření appky
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useActiveGame() {
  const active = useSyncExternalStore(subscribe, read, () => null);
  const update = useCallback((fn: (g: ActiveGame) => ActiveGame) => {
    const current = read();
    if (current) write(fn(current));
  }, []);
  return { active, start: write, update, clear: () => write(null) };
}
