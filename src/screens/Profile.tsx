import { useState } from "react";
import { Icon } from "../components/Icon";
import { signOut, useAuth } from "../lib/auth";
import { MODULES, MODULE_BY_KEY, type ModuleKey } from "../lib/modules";
import { usePinnedModules } from "../lib/settings";
import { isDemo } from "../lib/supabase";
import { ImportSection } from "./ImportSection";
import { NotifySection } from "./NotifySection";
import { THEMES, useTheme } from "../lib/theme";
import { readPlayInSilent, setPlayInSilent } from "../lib/sound";

export function Profile() {
  const { session } = useAuth();
  const { pinned, setPinned, error } = usePinnedModules();
  const { theme, setTheme } = useTheme();
  const [silent, setSilent] = useState(readPlayInSilent);
  const unpinned = MODULES.filter((m) => !pinned.includes(m.key));

  const move = (index: number, delta: number) => {
    const next = [...pinned];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    setPinned(next);
  };
  const remove = (key: ModuleKey) => setPinned(pinned.filter((k) => k !== key));
  const add = (key: ModuleKey) => setPinned([...pinned, key]);

  return (
    <div className="screen">
      <header className="topbar"><h1>Profil</h1></header>

      <section className="sec">
        <div className="panel">
          <h3>Hráč</h3>
          {isDemo ? (
            <p>Ukázkový režim bez přihlášení. Po připojení Supabase se tu objeví tvůj e-mail.</p>
          ) : (
            <>
              <p>{session?.user.email}</p>
              <button className="btn tap wide" onClick={signOut}>Odhlásit se</button>
            </>
          )}
        </div>
      </section>

      <section className="sec" id="vzhled">
        <h2>Vzhled</h2>
        <div className="panel">
          <div className="theme-pick" role="radiogroup" aria-label="Vzhled">
            {THEMES.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} className={`theme-opt${theme === t.id ? " on" : ""}`} onClick={() => setTheme(t.id)}>
                <span className="theme-swatch" style={{ background: t.bg, color: t.fg }} aria-hidden="true"><Icon name="untrois" size={30} /></span>
                <span>{t.name}</span>
              </button>
            ))}
          </div>
          <p className="small muted theme-note">{theme === "barevny" ? "Každý modul má svou barvu." : "Jen dvě barvy jako logo. Platí pro tohle zařízení."}</p>
        </div>
      </section>

      <section className="sec" id="moduly">
        <h2>Moduly na obrazovce Dnes</h2>
        <div className="panel">
          {error && <p className="error">Nastavení se nepodařilo uložit. Zkontroluj připojení a zkus to znovu.</p>}
          <ul className="pin-list">
            {pinned.map((key, i) => (
              <li key={key}>
                <Icon name={key} size={32} />
                <span className="pin-name">{MODULE_BY_KEY[key].name}</span>
                <button className="icon-btn" aria-label={`Posunout ${MODULE_BY_KEY[key].name} výš`} disabled={i === 0} onClick={() => move(i, -1)}><Icon name="i-up" size={18} /></button>
                <button className="icon-btn" aria-label={`Posunout ${MODULE_BY_KEY[key].name} níž`} disabled={i === pinned.length - 1} onClick={() => move(i, 1)}><Icon name="i-down" size={18} /></button>
                <button className="chip" onClick={() => remove(key)}>Pryč</button>
              </li>
            ))}
          </ul>
          {unpinned.length > 0 && (
            <>
              <h3 className="sec">Další moduly</h3>
              <ul className="pin-list">
                {unpinned.map((m) => (
                  <li key={m.key}>
                    <Icon name={m.key} size={32} />
                    <span className="pin-name">{m.name}</span>
                    <button className="chip" onClick={() => add(m.key)}>Připnout</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="sec" id="zvuky">
        <h2>Zvuky</h2>
        <div className="panel">
          <ul className="notify-list">
            <li>
              <label className="notify-main">
                <input type="checkbox" role="switch" className="switch" checked={silent} onChange={(e) => { setSilent(e.target.checked); setPlayInSilent(e.target.checked); }} />
                <span>
                  <b>Hrát i v tichém režimu</b>
                  <small>Gong, pípnutí a zvonky uslyšíš i s přepínačem ticha. Hudba z jiné appky se při spuštění zvuku zastaví.</small>
                </span>
              </label>
            </li>
          </ul>
        </div>
      </section>

      <NotifySection />

      <ImportSection />

      <p className="version">Verze {__APP_VERSION__}</p>
    </div>
  );
}
