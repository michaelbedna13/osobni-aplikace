import { Link } from "react-router-dom";
import { Symbol } from "../components/Symbol";
import { MODULE_BY_KEY } from "../lib/modules";
import { usePinnedModules } from "../lib/settings";
import { isDemo } from "../lib/supabase";

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Today() {
  const { pinned } = usePinnedModules();
  const now = new Date();
  const weekday = capitalize(now.toLocaleDateString("cs-CZ", { weekday: "long" }));
  const date = now.toLocaleDateString("cs-CZ", { day: "numeric", month: "long" });

  return (
    <div className="screen">
      <header className="today-head pad">
        <div>
          <p className="muted">{weekday}</p>
          <h1>{date}</h1>
        </div>
        <Link to="/profil" className="avatar" aria-label="Profil">M</Link>
      </header>

      {isDemo && (
        <p className="demo-note pad">Ukázkový režim: Supabase zatím není připojený, nastavení se ukládá jen v tomto prohlížeči.</p>
      )}

      <section className="pad">
        <div className="sec-row">
          <h2 className="sec-title">Moje moduly</h2>
          <Link to="/profil#moduly" className="link">Upravit</Link>
        </div>
        <div className="shelf" aria-label="Oblíbené moduly, posuň do boku">
          {pinned.map((key) => {
            const m = MODULE_BY_KEY[key];
            return (
              <Link key={key} to={`/m/${key}`} className="fav tap" style={{ background: `${m.color}66` }}>
                <Symbol module={key} size={40} />
                <span className="fav-name">{m.name}</span>
                <span className="fav-num">–</span>
                <span className="fav-sub">Spustí se ve fázi {m.phase}</span>
              </Link>
            );
          })}
          <Link to="/profil#moduly" className="fav fav-edit">Přidat modul</Link>
        </div>
      </section>

      <section className="pad">
        <h2 className="sec-title">Brzy tady</h2>
        <div className="card soon">
          <div className="soon-row"><Symbol module="hlaskomat" size={32} /><span>Hláška dne</span></div>
          <div className="soon-row"><Symbol module="lide" size={32} /><span>Nejbližší narozeniny</span></div>
          <div className="soon-row"><Symbol module="denik" size={32} /><span>Za co jsem dnes vděčný?</span></div>
        </div>
      </section>
    </div>
  );
}
