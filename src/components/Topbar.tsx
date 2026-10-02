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
