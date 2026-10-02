import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sprite } from "./Sprite";

/** Horní lišta obrazovky: zpět, nadpis, volitelně něco vpravo. */
export function Topbar({ title, back = "/moduly", right }: { title: string; back?: string | null; right?: ReactNode }) {
  return (
    <header className="topbar">
      {back && (
        <Link to={back} className="block-btn" aria-label="Zpět">
          <Sprite name="i-back" size={20} />
        </Link>
      )}
      <h1>{title}</h1>
      {right}
    </header>
  );
}

/** Pixelové hvězdy na noční obrazovce. */
export function NightStars() {
  const stars = [
    { x: "66%", y: "18px", s: 12 }, { x: "54%", y: "64px", s: 16 }, { x: "84%", y: "110px", s: 12 },
    { x: "70%", y: "150px", s: 10 },
  ];
  return (
    <div className="night-stars" aria-hidden="true">
      {stars.map((st, i) => (
        <span key={i} style={{ left: st.x, top: st.y, position: "absolute" }} className={i % 2 ? "twinkle" : undefined}>
          <Sprite name="sparkle" size={st.s * 2} />
        </span>
      ))}
    </div>
  );
}
