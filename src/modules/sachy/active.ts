// Rozehraná partie: drží se v localStorage, takže přežije zavření appky.
import { useCallback, useSyncExternalStore } from "react";
import type { ChessGame } from "./game";

const KEY = "sachy:hra";
const listeners = new Set<() => void>();
let cache: ChessGame | null | undefined;

function read(): ChessGame | null {
  if (cache !== undefined) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null") as ChessGame | null;
    cache = parsed && Array.isArray(parsed.moves) && Array.isArray(parsed.clock) ? parsed : null;
  } catch {
    cache = null;
  }
  return cache;
}

function write(next: ChessGame | null) {
  cache = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // bez úložiště partie vydrží jen do zavření appky
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useActiveChess() {
  const game = useSyncExternalStore(subscribe, read, () => null);
  const set = useCallback((next: ChessGame | null) => write(next), []);
  const update = useCallback((fn: (g: ChessGame) => ChessGame | null) => {
    const current = read();
    if (!current) return;
    const next = fn(current);
    if (next) write(next);
  }, []);
  return { game, set, update };
}
