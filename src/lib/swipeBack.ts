import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Zpět švihnutím od levého okraje jako v nativní appce: obrazovka jede s prstem, po puštění buď odjede doprava
// a appka přejde na obrazovku „zpět“ (stejnou jako šipka v horní liště), nebo se vrátí na místo.
// Cíl hlásí Topbar (useSwipeBackTarget); obrazovky bez šipky zpět (Dnes, Moduly, Profil) gesto nemají.
// Kdo přišel do modulu z Dnes, vrátí se švihem na Dnes (jinak by šipka i švih vedly do Modulů).

const EDGE = 28; // jak blízko levého okraje musí prst začít (px)
const LOCK = 8; // po kolika px se rozhodne, jestli jde o švih do boku, nebo posun nahoru/dolů
const DONE = 0.32; // jakou část šířky je potřeba přetáhnout
const FLICK = 0.45; // nebo jak rychlý musí být švih (px/ms)
/** Kde švih nezačíná: mapa a hřiště mají vlastní tažení, otevřené okno se zavírá samo. */
const SKIP = ".map-box, .ch-arena, input[type=range]";

let backTo: string | null = null;
let cameFrom: string | null = null;

/** Topbar nastaví, kam vede švih zpět (null = nikam). */
export function useSwipeBackTarget(to: string | null) {
  useEffect(() => {
    backTo = to;
    return () => { if (backTo === to) backTo = null; };
  }, [to]);
}

export function useSwipeBack() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => () => { cameFrom = pathname; }, [pathname]);
  useEffect(() => {
    let screen: HTMLElement | null = null;
    let target: string | null = null;
    let x0 = 0, y0 = 0, dx = 0, lastX = 0, lastT = 0, speed = 0;
    let locked = false;

    const style = (el: HTMLElement, x: number, ms = 0) => {
      el.style.transition = ms ? `transform ${ms}ms cubic-bezier(0.2, 0.8, 0.2, 1)` : "none";
      el.style.transform = x ? `translateX(${x}px)` : "";
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
    };

    const move = (e: TouchEvent) => {
      if (!screen) return;
      const t = e.touches[0];
      const mx = t.clientX - x0, my = t.clientY - y0;
      if (!locked) {
        if (Math.abs(mx) < LOCK && Math.abs(my) < LOCK) return;
        if (mx <= 0 || Math.abs(my) > Math.abs(mx)) { screen = null; return; }
        locked = true;
        // pozadí obrazovky je jinak pevné k displeji; při posunu jede s obrazovkou
        screen.style.setProperty("--swipe-top", `${window.scrollY}px`);
        screen.classList.add("swiping");
      }
      e.preventDefault();
      const dt = Math.max(1, e.timeStamp - lastT);
      speed = (t.clientX - lastX) / dt;
      lastX = t.clientX;
      lastT = e.timeStamp;
      dx = Math.max(0, mx);
      style(screen, dx);
    };

    const end = () => {
      const el = screen;
      screen = null;
      if (!el || !locked) return;
      const width = el.getBoundingClientRect().width;
      if (dx > width * DONE || (speed > FLICK && dx > 30)) {
        style(el, width, 200);
        window.setTimeout(() => {
          if (target) navigate(target);
          // když zůstane stejná obrazovka (např. jen jiný parametr), vrátí ji na místo
          requestAnimationFrame(() => reset(el));
        }, 190);
      } else {
        style(el, 0, 220);
        window.setTimeout(() => reset(el), 230);
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
