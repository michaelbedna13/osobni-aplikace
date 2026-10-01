import { useNavigate } from "react-router-dom";
import { MODULES } from "../lib/modules";
import { Sheet } from "./Sheet";
import { Symbol } from "./Symbol";

/** Spodní panel s rychlými akcemi všech modulů (tlačítko + v liště). */
export function QuickAddSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <Sheet title="Rychle přidat" onClose={onClose}>
      <div className="quick-grid">
        {MODULES.map((m) => (
          <button
            key={m.key}
            className="quick-item tap"
            style={{ background: `${m.color}55` }}
            onClick={() => { onClose(); navigate(m.key === "hlaskomat" ? "/m/hlaskomat?nova=1" : `/m/${m.key}`); }}
          >
            <Symbol module={m.key} size={32} />
            <span>{m.quickAction}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
