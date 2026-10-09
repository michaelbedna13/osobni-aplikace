import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon";
import { MODULES } from "../lib/modules";

export function Modules() {
  return (
    <div className="screen">
      <header className="topbar"><h1>Moduly</h1></header>
      <div className="tiles">
        {MODULES.map((m) => (
          <Link
            key={m.key}
            to={`/m/${m.key}`}
            className={`tile tap${m.ready ? "" : " locked"}`}
            style={{ "--accent": m.color, "--deep": m.deep } as CSSProperties}
            aria-label={m.ready ? m.name : `${m.name} (zamčeno)`}
          >
            <span className="icon-slot"><Icon name={m.key} size={48} /></span>
            {!m.ready && <span className="lock"><Icon name="lock" size={20} label="Zamčeno" /></span>}
            <b>{m.name}</b>
          </Link>
        ))}
      </div>
    </div>
  );
}
