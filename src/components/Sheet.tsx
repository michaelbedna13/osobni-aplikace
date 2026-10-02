import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Spodní panel (dialog). Zavírá se klepnutím mimo panel nebo klávesou Escape. */
export function Sheet({ title, onClose, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const first = panel.current?.querySelector<HTMLElement>("button, input, select, textarea");
    first?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // do <body>, aby panel byl nad spodní lištou (obrazovka má vlastní vrstvení kvůli textuře)
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div ref={panel} className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <h2 className="sheet-title">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
