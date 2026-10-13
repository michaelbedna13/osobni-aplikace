import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

let openCount = 0;
// otevřená okna od spodního po horní: Escape zavře jen to nahoře (okno týmu nad oknem nové hry)
const stack: object[] = [];

/**
 * Společné chování oken: Escape zavře, pozadí se neposouvá a pole, do kterého se píše,
 * se po vyjetí klávesnice posune do viditelné části okna.
 */
function useDialog(box: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    const me = {};
    stack.push(me);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && stack[stack.length - 1] === me && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(me), 1);
    };
  }, [onClose]);

  useEffect(() => {
    const el = box.current;
    // fokus na okno, ne na první pole – klávesnice nevyskočí sama od sebe
    if (el && !el.querySelector("[autofocus]")) el.focus({ preventScroll: true });
    openCount++;
    document.documentElement.classList.add("dialog-open");
    let timer = 0;
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      if (!t.matches("input, textarea, select")) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => t.scrollIntoView({ block: "center", behavior: "smooth" }), 320);
    };
    el?.addEventListener("focusin", onFocus);
    return () => {
      el?.removeEventListener("focusin", onFocus);
      window.clearTimeout(timer);
      if (--openCount === 0) document.documentElement.classList.remove("dialog-open");
    };
  }, [box]);
}

/**
 * Zavření stažením dolů (jako karta v iOS): táhne se celé okno, po puštění dál než ~120 px nebo rychlým
 * švihnutím zmizí, jinak se vrátí. Netáhne se, když obsah pod prstem není odrolovaný nahoru nebo se píše do pole.
 */
function useSwipeDown(box: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    const el = box.current;
    const backdrop = el?.parentElement;
    if (!el || !backdrop) return;
    let startX = 0;
    let startY = 0;
    let dy = 0;
    let lastY = 0;
    let lastT = 0;
    let speed = 0;
    let state: "idle" | "maybe" | "drag" = "idle";

    const scrolledDown = (target: EventTarget | null) => {
      for (let n = target as HTMLElement | null; n && n !== backdrop; n = n.parentElement) if (n.scrollTop > 0) return true;
      return false;
    };
    const start = (e: TouchEvent) => {
      state = "idle";
      const t = e.target as HTMLElement;
      if (e.touches.length !== 1 || t.closest("input, textarea, select, [contenteditable]") || scrolledDown(t)) return;
      startX = e.touches[0].clientX;
      startY = lastY = e.touches[0].clientY;
      lastT = performance.now();
      dy = speed = 0;
      state = "maybe";
    };
    const move = (e: TouchEvent) => {
      if (state === "idle") return;
      const x = e.touches[0].clientX - startX;
      const y = e.touches[0].clientY - startY;
      if (state === "maybe") {
        if (Math.abs(x) < 8 && Math.abs(y) < 8) return;
        // nahoru nebo do strany = obyčejné rolování
        if (y <= 0 || Math.abs(x) > Math.abs(y)) { state = "idle"; return; }
        state = "drag";
        el.style.transition = "none";
      }
      e.preventDefault();
      const now = performance.now();
      speed = (e.touches[0].clientY - lastY) / Math.max(1, now - lastT);
      lastY = e.touches[0].clientY;
      lastT = now;
      dy = Math.max(0, y);
      el.style.transform = `translateY(${dy}px)`;
      backdrop.style.setProperty("--dim", String(Math.max(0, 1 - dy / 500)));
    };
    const end = () => {
      if (state !== "drag") { state = "idle"; return; }
      state = "idle";
      el.style.transition = "transform 240ms var(--step), opacity 240ms var(--step)";
      if (dy > 120 || speed > 0.5) {
        el.style.transform = `translateY(${window.innerHeight}px)`;
        el.style.opacity = "0";
        backdrop.style.setProperty("--dim", "0");
        window.setTimeout(onClose, 200);
      } else {
        el.style.transform = "";
        backdrop.style.removeProperty("--dim");
      }
    };
    el.addEventListener("touchstart", start, { passive: true });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [box, onClose]);
}

/** Okno uprostřed obrazovky bez hlavičky (detail hlášky apod.). */
export function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useDialog(box, onClose);
  useSwipeDown(box, onClose);
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={box} tabIndex={-1} className="modal" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Okno s nadpisem a křížkem – formuláře pro zápis a úpravy v celé appce. Zavře se i stažením dolů.
 * `scrollList`: okno nepřeroste obrazovku, roluje se jen seznam uvnitř (třída `.window-list`), tlačítka zůstanou vidět.
 */
export function FormWindow({ title, onClose, children, scrollList }: { title: string; onClose: () => void; children: ReactNode; scrollList?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  useDialog(box, onClose);
  useSwipeDown(box, onClose);
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={box} tabIndex={-1} className={`modal form-window${scrollList ? " scroll-list" : ""}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <span className="grabber" aria-hidden="true" />
        <div className="form-window-head">
          <h2 className="sheet-title">{title}</h2>
          <button type="button" className="icon-btn close-btn" aria-label="Zavřít" onClick={onClose}>×</button>
        </div>
        <div className="form-window-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
