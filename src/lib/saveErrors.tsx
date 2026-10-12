import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { MutationCache, type Mutation } from "@tanstack/react-query";

// Neuložená změna nesmí zmizet potichu: mutace se při výpadku sítě samy zopakují (main.tsx) a když to nepomůže,
// ukáže se dole hláška s důvodem a tlačítkem „Zkusit znovu“ (spustí stejnou změnu ještě jednou).

interface Failure {
  message: string;
  retry: () => void;
}

let failure: Failure | null = null;
const listeners = new Set<() => void>();
const set = (f: Failure | null) => {
  failure = f;
  listeners.forEach((l) => l());
};

/** Lidsky čitelný důvod (Supabase vrací { message, code }, fetch „Load failed“). */
function describe(error: unknown): string {
  const e = error as { message?: string; code?: string } | null;
  const msg = e?.message ?? String(error);
  if (/load failed|failed to fetch|network/i.test(msg)) return "bez připojení";
  if (e?.code === "42P01" || /does not exist/i.test(msg)) return "v databázi chybí tabulka – je spuštěné SQL?";
  if (e?.code === "42501" || /permission denied|row-level security/i.test(msg)) return "databáze to nedovolila";
  return msg.length > 80 ? `${msg.slice(0, 80)}…` : msg;
}

export const mutationCache = new MutationCache({
  onError: (error, variables, _context, mutation) => {
    set({
      message: describe(error),
      retry: () => {
        set(null);
        void (mutation as Mutation<unknown, unknown, unknown, unknown>).execute(variables).catch(() => {});
      },
    });
  },
  onSuccess: () => {
    if (failure) set(null);
  },
});

/** Hláška o neuložené změně (vykresluje App, jednou pro celou appku). */
export function SaveErrors() {
  const f = useSyncExternalStore((l) => { listeners.add(l); return () => { listeners.delete(l); }; }, () => failure, () => null);
  if (!f) return null;
  return createPortal(
    <div className="toast toast-error" role="alert">
      <span>Neuloženo: {f.message}</span>
      <button className="toast-action" onClick={f.retry}>Zkusit znovu</button>
      <button className="toast-close" aria-label="Zavřít" onClick={() => set(null)}>×</button>
    </div>,
    document.body,
  );
}
