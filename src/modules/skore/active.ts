// Rozehraná hra: drží se v localStorage, takže přežije zavření appky.
import { useCallback, useSyncExternalStore } from "react";
import type { GameKind, Settings, Turn } from "./rules";

export interface ActiveScoreGame {
  started_at: string;
  kind: GameKind;
  settings: Settings;
  players: string[];
  turns: Turn[];
  /** Vlastní hru ukončil hráč ručně. */
  finished?: boolean;
}

const KEY = "skore:active";
const listeners = new Set<() => void>();
let cache: ActiveScoreGame | null | undefined;

function read(): ActiveScoreGame | null {
  if (cache !== undefined) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null") as ActiveScoreGame | null;
    cache = parsed && Array.isArray(parsed.players) && Array.isArray(parsed.turns) ? parsed : null;
  } catch {
    cache = null;
  }
  return cache;
}

function write(next: ActiveScoreGame | null) {
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

export function useActiveScoreGame() {
  const active = useSyncExternalStore(subscribe, read, () => null);
  const update = useCallback((fn: (g: ActiveScoreGame) => ActiveScoreGame) => {
    const current = read();
    if (current) write(fn(current));
  }, []);
  return { active, start: write, update, clear: () => write(null) };
}
