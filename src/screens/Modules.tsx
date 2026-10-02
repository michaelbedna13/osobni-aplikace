import { Link } from "react-router-dom";
import { Sprite } from "../components/Sprite";
import { MODULES } from "../lib/modules";
import { usePinnedModules } from "../lib/settings";

export function Modules() {
  const { pinned } = usePinnedModules();
  return (
    <div className="screen night">
      <header className="topbar"><h1>Moduly</h1></header>
      <p className="small muted">Barevné jsou hotové, tmavé se teprve odemknou. Hvězdička = připnuto na Dnes.</p>
      <div className="tiles">
        {MODULES.map((m) => (
          <Link key={m.key} to={`/m/${m.key}`} className={`tile tap${m.ready ? "" : " locked"}`} style={{ background: m.color }}>
            <Sprite name={m.key} size={56} />
            {m.ready
              ? pinned.includes(m.key) && <span className="pin"><Sprite name="star" size={24} label="Připnuto" /></span>
              : <span className="lock"><Sprite name="lock" size={24} label="Zamčeno" /></span>}
            <b>{m.name}</b>
            <span>{m.ready ? "Hraj" : `Odemkne se ve fázi ${m.phase}`}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
