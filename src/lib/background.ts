// Vzhled pozadí: světlo (zrnitý paprsek v barvě modulu), vzor (oblé tahy), obojí, nebo původní tečky.
// Drží se v zařízení a nastavuje se jako atribut <html data-bg="…">.
import { useCallback, useSyncExternalStore } from "react";

export type Background = "oboje" | "svetlo" | "vzor" | "tecky";
export const BACKGROUNDS: Record<Background, string> = { oboje: "Světlo a vzor", svetlo: "Světlo", vzor: "Vzor", tecky: "Tečky" };

const KEY = "pozadi";
const listeners = new Set<() => void>();

function read(): Background {
  try {
    const v = localStorage.getItem(KEY);
    if (v && v in BACKGROUNDS) return v as Background;
  } catch {
    // výchozí
  }
  return "oboje";
}

export function applyBackground(bg: Background = read()) {
  document.documentElement.dataset.bg = bg;
}

export function useBackground() {
  const bg = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, read, () => "oboje" as Background);
  const set = useCallback((next: Background) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // jen do zavření appky
    }
    applyBackground(next);
    listeners.forEach((l) => l());
  }, []);
  return { bg, set };
}
