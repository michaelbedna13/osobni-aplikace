import { Link, Navigate, useParams } from "react-router-dom";
import { Symbol } from "../components/Symbol";
import { BackIcon } from "../components/Icons";
import { MODULE_BY_KEY, isModuleKey, type ModuleKey } from "../lib/modules";
import { usePinnedModules } from "../lib/settings";

/** Stránka modulu. Dokud modul není hotový, ukazuje, co bude umět. */
export function ModuleScreen({ moduleKey, showBack = true }: { moduleKey?: ModuleKey; showBack?: boolean }) {
  const params = useParams();
  const key = moduleKey ?? params.key;
  const { pinned, setPinned } = usePinnedModules();
  if (!isModuleKey(key)) return <Navigate to="/moduly" replace />;

  const m = MODULE_BY_KEY[key];
  const isPinned = pinned.includes(key);
  const togglePin = () => setPinned(isPinned ? pinned.filter((k) => k !== key) : [...pinned, key]);

  return (
    <div className="screen">
      <header className="poster" style={{ background: m.color }}>
        <span className="poster-art"><Symbol module={key} size={170} bg="#FFFFFF" /></span>
        <div className="poster-title">
          {showBack && <Link to="/moduly" className="back" aria-label="Zpět na moduly"><BackIcon /></Link>}
          <h1>{m.name}</h1>
        </div>
      </header>

      <div className="pad">
        <div className="card building">
          <h2>Tento modul se staví</h2>
          <p className="muted">Přijde na řadu ve fázi {m.phase}. Bude umět:</p>
          <ul>
            {m.plan.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <button className="btn tap wide" onClick={togglePin}>
          {isPinned ? "Odepnout z obrazovky Dnes" : "Připnout na obrazovku Dnes"}
        </button>
      </div>
    </div>
  );
}
