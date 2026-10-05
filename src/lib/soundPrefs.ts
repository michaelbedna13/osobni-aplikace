// Které zvuky se kde hrají. Drží se v tomto zařízení (zvuk je věc telefonu, ne účtu).
import { useCallback, useSyncExternalStore } from "react";
import { SOUND_IDS, type SoundId } from "./sound";

export interface SoundPrefs {
  medStart: SoundId;
  medEnd: SoundId;
  /** Zvonek během meditace každých N minut (0 = vypnuto). */
  medInterval: number;
  medIntervalSound: SoundId;
  workoutStart: SoundId;
  restEnd: SoundId;
  workoutEnd: SoundId;
}

export const DEFAULT_SOUNDS: SoundPrefs = {
  medStart: "gong",
  medEnd: "gong",
  medInterval: 0,
  medIntervalSound: "zvonek",
  workoutStart: "ticho",
  restEnd: "pipnuti",
  workoutEnd: "fanfara",
};

const KEY = "zvuky";
const listeners = new Set<() => void>();
let cache: SoundPrefs | undefined;

function sanitize(raw: Partial<SoundPrefs> | null): SoundPrefs {
  const out = { ...DEFAULT_SOUNDS };
  if (!raw) return out;
  for (const k of Object.keys(DEFAULT_SOUNDS) as (keyof SoundPrefs)[]) {
    const v = raw[k];
    if (k === "medInterval") {
      if (typeof v === "number" && v >= 0 && v <= 60) out.medInterval = v;
    } else if (typeof v === "string" && (SOUND_IDS as string[]).includes(v)) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

function read(): SoundPrefs {
  if (cache) return cache;
  try {
    cache = sanitize(JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<SoundPrefs> | null);
  } catch {
    cache = { ...DEFAULT_SOUNDS };
  }
  return cache;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useSoundPrefs() {
  const prefs = useSyncExternalStore(subscribe, read, () => DEFAULT_SOUNDS);
  const update = useCallback((patch: Partial<SoundPrefs>) => {
    cache = { ...read(), ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      // nastavení vydrží do zavření appky
    }
    listeners.forEach((l) => l());
  }, []);
  return { prefs, update };
}

/** Pro místa mimo React (např. v obsluze události). */
export const soundPrefs = () => read();

export { sanitize as sanitizeSoundPrefs };
