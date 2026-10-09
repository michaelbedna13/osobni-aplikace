import { useEffect } from "react";
import { useIsFetching } from "@tanstack/react-query";

// Úvodní obrazovka (#splash v index.html): znak Untrois se rozvine a zmizí, až když jsou načtená data první
// obrazovky, aby nikde neproblikly nuly. Drží se aspoň chvilku, aby animace doběhla, a nejdéle pár sekund,
// kdyby byla síť pomalá. Počasí se nečeká (má vlastní stav načítání).

const MIN_MS = 1300;
const MAX_MS = 4500;
const SETTLE_MS = 120;

let hidden = false;
/** Kdy se úvodní obrazovka poprvé ukázala (zapisuje inline skript v index.html, až jsou styly načtené). */
const shownAt = (): number => (window as { __splashAt?: number }).__splashAt ?? 0;

export function hideSplash() {
  if (hidden) return;
  hidden = true;
  const el = document.getElementById("splash");
  if (!el) return;
  el.classList.add("out");
  window.setTimeout(() => el.remove(), 600);
}

if (typeof window !== "undefined") window.setTimeout(hideSplash, Math.max(0, shownAt() + MAX_MS - performance.now()));

/** Skryje úvodní obrazovku, jakmile appka nic nenačítá (ready = přihlášení je vyřešené). */
export function useSplash(ready: boolean) {
  const fetching = useIsFetching({ predicate: (q) => q.queryKey[0] !== "weather" });
  useEffect(() => {
    if (!ready || fetching > 0 || hidden) return;
    // počká na první dotazy obrazovky (spustí se až po vykreslení) a na konec animace
    const t = window.setTimeout(hideSplash, Math.max(SETTLE_MS, shownAt() + MIN_MS - performance.now()));
    return () => window.clearTimeout(t);
  }, [ready, fetching]);
}
