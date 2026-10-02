import { useEffect, useState, type CSSProperties } from "react";

interface Props {
  /** Změna hodnoty spustí oslavu znovu. 0 = nic. */
  trigger: number;
  /** Text, který vyletí nahoru (např. „+1“). */
  text?: string;
  colors?: string[];
}

const PIECES = 14;

/** Pixelové konfety a vyletující text – odměna za akci. */
export function Burst({ trigger, text, colors = ["#FFE04A", "#FF4D6D", "#6C8CFF", "#4CD07D", "#FFFFFF"] }: Props) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    setShown(trigger);
    const t = window.setTimeout(() => setShown(0), 900);
    return () => window.clearTimeout(t);
  }, [trigger]);

  if (!shown) return null;
  return (
    <span className="burst" aria-hidden="true" key={shown}>
      {Array.from({ length: PIECES }, (_, i) => {
        const angle = (i / PIECES) * Math.PI * 2 + (shown % 7) * 0.3;
        const dist = 70 + ((i * 37 + shown) % 50);
        return (
          <i
            key={i}
            style={{
              "--dx": `${Math.round(Math.cos(angle) * dist)}px`,
              "--dy": `${Math.round(Math.sin(angle) * dist - 30)}px`,
              background: colors[i % colors.length],
            } as CSSProperties}
          />
        );
      })}
      {text && <b className="burst-text">{text}</b>}
    </span>
  );
}
