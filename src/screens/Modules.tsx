import { Link } from "react-router-dom";
import { Symbol } from "../components/Symbol";
import { MODULES } from "../lib/modules";
import { usePinnedModules } from "../lib/settings";

export function Modules() {
  const { pinned } = usePinnedModules();

  return (
    <div className="screen pad">
      <h1 className="page-title">Moduly</h1>
      <p className="muted">Tečka znamená, že je modul připnutý na obrazovce Dnes.</p>
      <div className="tiles">
        {MODULES.map((m) => (
          <Link key={m.key} to={`/m/${m.key}`} className="tile tap" style={{ background: `${m.color}55` }}>
            {pinned.includes(m.key) && <i className="pin-dot" aria-label="Připnuto" />}
            <Symbol module={m.key} size={48} />
            <b>{m.name}</b>
            <span>{m.ready ? "Hotovo" : `Fáze ${m.phase}`}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
