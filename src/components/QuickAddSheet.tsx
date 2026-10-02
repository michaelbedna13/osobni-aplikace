import { useNavigate } from "react-router-dom";
import { MODULES } from "../lib/modules";
import { Sheet } from "./Sheet";
import { Sprite } from "./Sprite";

const PATHS: Partial<Record<string, string>> = {
  hlaskomat: "/m/hlaskomat?nova=1",
  meditace: "/m/meditace?start=1",
};

/** Spodní panel s rychlými akcemi všech modulů (tlačítko + v liště). */
export function QuickAddSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <Sheet title="Co zapíšeme?" onClose={onClose}>
      <div className="quick-grid">
        {MODULES.map((m) => (
          <button
            key={m.key}
            className="quick-item tap"
            style={{ background: m.ready ? m.color : m.light }}
            onClick={() => { onClose(); navigate(PATHS[m.key] ?? `/m/${m.key}`); }}
          >
            <Sprite name={m.key} size={32} />
            <span>{m.quickAction}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
