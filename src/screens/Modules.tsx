import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { MODULES } from "../lib/modules";
import { usePinnedModules } from "../lib/settings";

export function Modules() {
  const { pinned } = usePinnedModules();
  return (
    <div className="screen">
      <header className="topbar"><h1>Moduly</h1></header>
      <div className="tiles">
        {MODULES.map((m) => (
          <Link
            key={m.key}
            to={`/m/${m.key}`}
            className={`tile tap${m.ready ? "" : " locked"}`}
            style={{ "--accent": m.color } as CSSProperties}
            aria-label={m.ready ? m.name : `${m.name} (zamčeno)`}
          >
            <span className="icon-slot"><Icon name={m.key} size={48} /></span>
            {m.ready
              ? pinned.includes(m.key) && <span className="pin"><Icon name="star" size={20} label="Připnuto" /></span>
              : <span className="lock"><Icon name="lock" size={20} label="Zamčeno" /></span>}
            <b>{m.name}</b>
          </Link>
        ))}
      </div>
    </div>
  );
}
