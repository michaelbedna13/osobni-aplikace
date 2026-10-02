// Běžící meditace. Čas se počítá z časových značek (ne „tikáním“),
// takže sedí i po zamčení telefonu nebo znovuotevření appky.

export interface TimerState {
  /** Kdy meditace začala (ISO). */
  startedAt: string;
  /** Plánovaná délka v sekundách; null = bez omezení (stopky). */
  plannedSeconds: number | null;
  /** Odměřené sekundy před posledním pozastavením. */
  elapsedBefore: number;
  /** Kdy se naposledy spustila / pokračovala (ms); null = pozastaveno. */
  runningSince: number | null;
}

export const elapsedSeconds = (s: TimerState, now = Date.now()) =>
  s.elapsedBefore + (s.runningSince === null ? 0 : (now - s.runningSince) / 1000);

export function startTimer(plannedSeconds: number | null, now = Date.now()): TimerState {
  return { startedAt: new Date(now).toISOString(), plannedSeconds, elapsedBefore: 0, runningSince: now };
}

export const pauseTimer = (s: TimerState, now = Date.now()): TimerState =>
  s.runningSince === null ? s : { ...s, elapsedBefore: elapsedSeconds(s, now), runningSince: null };

export const resumeTimer = (s: TimerState, now = Date.now()): TimerState =>
  s.runningSince !== null ? s : { ...s, runningSince: now };

/** Odměřený čas, nejvýš plánovaná délka. */
export const finalSeconds = (s: TimerState, now = Date.now()) =>
  Math.round(s.plannedSeconds === null ? elapsedSeconds(s, now) : Math.min(elapsedSeconds(s, now), s.plannedSeconds));

export const isFinished = (s: TimerState, now = Date.now()) =>
  s.plannedSeconds !== null && elapsedSeconds(s, now) >= s.plannedSeconds;

const KEY = "meditace-timer";
const LAST_KEY = "meditace-delka";

export function loadTimer(): TimerState | null {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (raw && typeof raw === "object" && "startedAt" in raw) return raw as TimerState;
  } catch {
    // ignorovat
  }
  return null;
}

export function saveTimer(s: TimerState | null) {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  } catch {
    // bez úložiště se běžící meditace po zavření appky ztratí
  }
}

/** Naposledy zvolená délka v minutách (0 = bez omezení). */
export function loadLastMinutes() {
  try {
    const v = Number(localStorage.getItem(LAST_KEY));
    return Number.isFinite(v) && v >= 0 && localStorage.getItem(LAST_KEY) !== null ? v : 10;
  } catch {
    return 10;
  }
}

export function saveLastMinutes(minutes: number) {
  try {
    localStorage.setItem(LAST_KEY, String(minutes));
  } catch {
    // ignorovat
  }
}
