import { createContext, useContext, useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Zpět švihnutím od levého okraje jako v nativní appce: obrazovka jede s prstem a pod ní už je vidět obrazovka,
// kam se švih vrací (podklad `.swipe-under` vykresluje Layout, mírně posunutý a ztmavený jako v iOS). Po puštění
// obrazovka buď odjede a appka přejde zpět (stejně jako šipka v horní liště), nebo se vrátí na místo.
// Cíl hlásí Topbar (useSwipeBackTarget); obrazovky bez šipky zpět (Dnes, Moduly, Profil) gesto nemají.
// Kdo přišel do modulu z Dnes, vrátí se švihem na Dnes (šipka vede do Modulů).
// Pohyb se zapisuje rovnou do stylů (bez překreslování Reactu), aby jel plynule s prstem.

const EDGE = 28; // jak blízko levého okraje musí prst začít (px)
const LOCK = 8; // po kolika px se rozhodne, jestli jde o švih do boku, nebo posun nahoru/dolů
const DONE = 0.32; // jakou část šířky je potřeba přetáhnout
const FLICK = 0.45; // nebo jak rychlý musí být švih (px/ms)
const PARALLAX = 0.28; // o kolik je podklad na začátku posunutý doleva (část šířky)
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Kde švih nezačíná: mapa a hřiště mají vlastní tažení, otevřené okno se zavírá samo. */
const SKIP = ".map-box, .ch-arena, input[type=range]";

let backTo: string | null = null;
let cameFrom: string | null = null;

// cesta obrazovky, která se má vykreslit pod odjíždějící obrazovkou (null = žádný podklad)
let peek: string | null = null;
const listeners = new Set<() => void>();
const setPeek = (p: string | null) => {
  if (peek === p) return;
  peek = p;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useSwipePeek = () => useSyncExternalStore(subscribe, () => peek, () => null);

/** true uvnitř podkladu: obrazovka tam jen ukazuje, jak bude vypadat, a nic nehlásí. */
export const SwipeUnderContext = createContext(false);

/** Topbar nastaví, kam vede švih zpět (null = nikam). */
export function useSwipeBackTarget(to: string | null) {
  const under = useContext(SwipeUnderContext);
  useEffect(() => {
    if (under) return;
    backTo = to;
    return () => { if (backTo === to) backTo = null; };
  }, [to, under]);
}

export function useSwipeBack() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => () => { cameFrom = pathname; }, [pathname]);
  // po přechodu zpět (nebo jinam) uklidí podklad a styly ještě před vykreslením nové obrazovky
  useLayoutEffect(() => { setPeek(null); }, [pathname]);

  useEffect(() => {
    let screen: HTMLElement | null = null;
    let target: string | null = null;
    let x0 = 0, y0 = 0, dx = 0, width = 0, lastX = 0, lastT = 0, speed = 0;
    let locked = false, frame = 0;

    const under = () => document.querySelector<HTMLElement>(".swipe-under");
    /** Posune obrazovku na x px (0 = na místě) a podklad s ní; ms = plynulý dojezd. */
    const place = (el: HTMLElement, x: number, ms = 0) => {
      const p = width ? Math.min(1, x / width) : 0;
      const u = under();
      const t = ms ? `transform ${ms}ms ${EASE}` : "none";
      el.style.transition = t;
      el.style.transform = `translate3d(${x}px, 0, 0)`;
      if (u) {
        u.style.transition = t;
        u.style.transform = `translate3d(${-(1 - p) * width * PARALLAX}px, 0, 0)`;
        const dim = u.querySelector<HTMLElement>(".swipe-dim");
        if (dim) {
          dim.style.transition = ms ? `opacity ${ms}ms ${EASE}` : "none";
          dim.style.opacity = String(1 - p);
        }
      }
    };
    const reset = (el: HTMLElement) => {
      el.classList.remove("swiping");
      el.style.transition = "";
      el.style.transform = "";
    };

    const start = (e: TouchEvent) => {
      screen = null;
      locked = false;
      if (!backTo || e.touches.length !== 1 || document.querySelector('[aria-modal="true"]')) return;
      const t = e.touches[0];
      if (t.clientX > EDGE || (e.target instanceof Element && e.target.closest(SKIP))) return;
      screen = document.querySelector<HTMLElement>(".app-main > .screen");
      target = cameFrom === "/" ? "/" : backTo;
      x0 = lastX = t.clientX;
      y0 = t.clientY;
      lastT = e.timeStamp;
      dx = speed = 0;
      // podklad se vykreslí hned při doteku u okraje, aby byl hotový, než se obrazovka pohne
      setPeek(target);
    };

    const move = (e: TouchEvent) => {
      if (!screen) return;
      const t = e.touches[0];
      const mx = t.clientX - x0, my = t.clientY - y0;
      if (!locked) {
        if (Math.abs(mx) < LOCK && Math.abs(my) < LOCK) return;
        if (mx <= 0 || Math.abs(my) > Math.abs(mx)) { screen = null; setPeek(null); return; }
        locked = true;
        width = screen.getBoundingClientRect().width;
        // pozadí obrazovky je jinak pevné k displeji; při posunu jede s obrazovkou
        screen.style.setProperty("--swipe-top", `${window.scrollY}px`);
        screen.classList.add("swiping");
      }
      e.preventDefault();
      const dt = Math.max(1, e.timeStamp - lastT);
      speed = 0.6 * ((t.clientX - lastX) / dt) + 0.4 * speed;
      lastX = t.clientX;
      lastT = e.timeStamp;
      dx = Math.max(0, mx);
      const el = screen;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => place(el, dx));
    };

    const end = () => {
      const el = screen;
      screen = null;
      cancelAnimationFrame(frame);
      if (!el) return;
      if (!locked) { setPeek(null); return; }
      if (dx > width * DONE || (speed > FLICK && dx > 30)) {
        // dojezd tím rychleji, čím rychlejší byl švih
        const ms = Math.round(Math.min(320, Math.max(160, ((width - dx) / Math.max(speed, 1.2)) * 1.4)));
        place(el, width, ms);
        window.setTimeout(() => {
          if (target) navigate(target);
          requestAnimationFrame(() => reset(el));
        }, ms);
      } else {
        place(el, 0, 260);
        window.setTimeout(() => { reset(el); setPeek(null); }, 270);
      }
    };

    document.addEventListener("touchstart", start, { passive: true });
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", end);
    document.addEventListener("touchcancel", end);
    return () => {
      document.removeEventListener("touchstart", start);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", end);
      document.removeEventListener("touchcancel", end);
    };
  }, [navigate]);
}
