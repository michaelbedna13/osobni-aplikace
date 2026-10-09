import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSwipeBackTarget } from "../lib/swipeBack";
import { Icon } from "./Icon";

/** Horní lišta obrazovky: zpět, nadpis, volitelně něco vpravo. */
/** brand = název značky untrois, píše se vždy malými písmeny (nadpisy jsou jinak verzálkami). */
export function Topbar({ title, back = "/moduly", right, brand }: { title: string; back?: string | null; right?: ReactNode; brand?: boolean }) {
  useSwipeBackTarget(back);
  return (
    <header className="topbar">
      {back && (
        <Link to={back} className="block-btn" aria-label="Zpět">
          <Icon name="i-back" size={20} />
        </Link>
      )}
      <h1 className={brand ? "brand" : undefined}>{title}</h1>
      {right}
    </header>
  );
}
