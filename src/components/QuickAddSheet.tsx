import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MODULES } from "../lib/modules";
import { Symbol } from "./Symbol";

/** Spodní panel s rychlými akcemi všech modulů (tlačítko + v liště). */
export function QuickAddSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const firstButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="quick-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <h2 id="quick-title" className="sheet-title">Rychle přidat</h2>
        <div className="quick-grid">
          {MODULES.map((m, i) => (
            <button
              key={m.key}
              ref={i === 0 ? firstButton : undefined}
              className="quick-item tap"
              style={{ background: `${m.color}55` }}
              onClick={() => { onClose(); navigate(`/m/${m.key}`); }}
            >
              <Symbol module={m.key} size={32} />
              <span>{m.quickAction}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
