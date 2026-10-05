// Rozehraná hra: drží se v localStorage, takže přežije zavření appky.
import { useCallback, useSyncExternalStore } from "react";
import type { Dart, DartSettings, Visit } from "./darts";

export interface ActiveDarts {
  started_at: string;
  settings: DartSettings;
  players: string[];
  turns: Visit[];
  /** Šipky rozhozeného náhozu (zadávání po šipkách). */
  pending?: Dart[];
}

const KEY = "sipky:active";
const listeners = new Set<() => void>();
let cache: ActiveDarts | null | undefined;

function read(): ActiveDarts | null {
  if (cache !== undefined) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null") as ActiveDarts | null;
    cache = parsed && parsed.settings && Array.isArray(parsed.players) && Array.isArray(parsed.turns) ? parsed : null;
  } catch {
    cache = null;
  }
  return cache;
}

function write(next: ActiveDarts | null) {
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

export function useActiveDarts() {
  const active = useSyncExternalStore(subscribe, read, () => null);
  const update = useCallback((fn: (g: ActiveDarts) => ActiveDarts) => {
    const current = read();
    if (current) write(fn(current));
  }, []);
  return { active, start: write, update, clear: () => write(null) };
}
