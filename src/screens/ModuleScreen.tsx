import type { CSSProperties } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Sprite } from "../components/Sprite";
import { Topbar } from "../components/Topbar";
import { MODULE_BY_KEY, isModuleKey, type ModuleKey } from "../lib/modules";
import { usePinnedModules } from "../lib/settings";

/** Modul, který ještě není hotový: „zamčený level“ s tím, co bude umět. */
export function ModuleScreen({ moduleKey, showBack = true }: { moduleKey?: ModuleKey; showBack?: boolean }) {
  const params = useParams();
  const key = moduleKey ?? params.key;
  const { pinned, setPinned } = usePinnedModules();
  if (!isModuleKey(key)) return <Navigate to="/moduly" replace />;

  const m = MODULE_BY_KEY[key];
  const isPinned = pinned.includes(key);
  const togglePin = () => setPinned(isPinned ? pinned.filter((k) => k !== key) : [...pinned, key]);

  return (
    <div className="screen module" style={{ "--bg": m.color, "--deep": m.deep } as CSSProperties}>
      <div className="band">
        <Topbar title={m.name} back={showBack ? "/moduly" : null} />
        <div className="locked-hero">
          <Sprite name={key} size={128} anim="bob" />
          <p className="hero-cap">Odemkne se ve fázi {m.phase}</p>
        </div>
      </div>
      <section className="sec">
        <h2>Co tu bude</h2>
        <div className="panel">
          <ul className="plan">
            {m.plan.map((item) => <li key={item}><Sprite name="sparkle" size={20} />{item}</li>)}
          </ul>
        </div>
      </section>
      <button className="btn tap wide" onClick={togglePin}>
        {isPinned ? "Odepnout z obrazovky Dnes" : "Připnout na obrazovku Dnes"}
      </button>
    </div>
  );
}
