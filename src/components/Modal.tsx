import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

let openCount = 0;

/**
 * Společné chování oken: Escape zavře, pozadí se neposouvá a pole, do kterého se píše,
 * se po vyjetí klávesnice posune do viditelné části okna.
 */
function useDialog(box: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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

/** Okno uprostřed obrazovky bez hlavičky (detail hlášky apod.). */
export function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useDialog(box, onClose);
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={box} tabIndex={-1} className="modal" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Okno s nadpisem a křížkem – formuláře pro zápis a úpravy v celé appce. */
export function FormWindow({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useDialog(box, onClose);
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div ref={box} tabIndex={-1} className="modal form-window" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
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
