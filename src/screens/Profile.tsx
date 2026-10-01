import { DownIcon, UpIcon } from "../components/Icons";
import { Symbol } from "../components/Symbol";
import { signOut, useAuth } from "../lib/auth";
import { MODULES, MODULE_BY_KEY, type ModuleKey } from "../lib/modules";
import { usePinnedModules } from "../lib/settings";
import { isDemo } from "../lib/supabase";
import { ImportSection } from "./ImportSection";

export function Profile() {
  const { session } = useAuth();
  const { pinned, setPinned, error } = usePinnedModules();
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
    <div className="screen pad">
      <h1 className="page-title">Profil</h1>

      <section className="card">
        <h2 className="card-title">Účet</h2>
        {isDemo ? (
          <p className="muted">Ukázkový režim bez přihlášení. Po připojení Supabase se tady objeví tvůj e-mail.</p>
        ) : (
          <>
            <p>{session?.user.email}</p>
            <button className="btn tap wide" onClick={signOut}>Odhlásit se</button>
          </>
        )}
      </section>

      <section className="card" id="moduly">
        <h2 className="card-title">Moje moduly na obrazovce Dnes</h2>
        {error && <p className="error">Nastavení se nepodařilo uložit. Zkontroluj připojení a zkus to znovu.</p>}
        <ul className="pin-list">
          {pinned.map((key, i) => (
            <li key={key}>
              <Symbol module={key} size={28} />
              <span className="grow">{MODULE_BY_KEY[key].name}</span>
              <button className="icon-btn" aria-label={`Posunout ${MODULE_BY_KEY[key].name} výš`} disabled={i === 0} onClick={() => move(i, -1)}><UpIcon /></button>
              <button className="icon-btn" aria-label={`Posunout ${MODULE_BY_KEY[key].name} níž`} disabled={i === pinned.length - 1} onClick={() => move(i, 1)}><DownIcon /></button>
              <button className="chip" onClick={() => remove(key)}>Odepnout</button>
            </li>
          ))}
        </ul>
        {unpinned.length > 0 && (
          <>
            <h3 className="sub-title">Další moduly</h3>
            <ul className="pin-list">
              {unpinned.map((m) => (
                <li key={m.key}>
                  <Symbol module={m.key} size={28} />
                  <span className="grow">{m.name}</span>
                  <button className="chip" onClick={() => add(m.key)}>Připnout</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <ImportSection />

      <p className="muted small version">Verze {__APP_VERSION__}</p>
    </div>
  );
}
