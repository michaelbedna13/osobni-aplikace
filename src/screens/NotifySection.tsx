import { isDemo } from "../lib/supabase";
import { NOTIFY_TYPES, useNotifyPrefs, usePushDevice } from "../lib/push";

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6:00–23:00

/** Profil → Upozornění: zapnutí na zařízení, druhy a hodiny. */
export function NotifySection() {
  const { state, loading, enable, disable, test } = usePushDevice();
  const { prefs, set, error } = useNotifyPrefs();
  if (isDemo) return null;

  const failure = enable.error ?? disable.error ?? test.error ?? error;

  return (
    <section className="sec" id="upozorneni">
      <h2>Upozornění</h2>
      <div className="panel">
        {loading ? (
          <p className="muted">Zjišťuju, co tohle zařízení umí…</p>
        ) : state === "install" ? (
          <p>Upozornění chodí jen do appky na ploše. V Safari ťukni na Sdílet → Přidat na plochu a otevři untrois odtamtud.</p>
        ) : state === "unsupported" ? (
          <p>Tohle zařízení upozornění neumí. Na iPhonu je potřeba iOS 16.4 nebo novější.</p>
        ) : state === "denied" ? (
          <p>Upozornění jsou zakázaná. Povolíš je v Nastavení iPhonu → Oznámení → untrois.</p>
        ) : state === "off" ? (
          <>
            <p>Připomenu narozeniny, platby, nákup, meditaci a vděčnost. Co a kdy, nastavíš tady.</p>
            <button className="btn dark wide" disabled={enable.isPending} onClick={() => enable.mutate()}>
              {enable.isPending ? "Zapínám…" : "Zapnout upozornění"}
            </button>
          </>
        ) : (
          <>
            <ul className="notify-list">
              {NOTIFY_TYPES.map((t) => {
                const p = prefs[t.key];
                return (
                  <li key={t.key} className={p.on ? undefined : "off"}>
                    <label className="notify-main">
                      <input type="checkbox" role="switch" className="switch" checked={p.on} onChange={(e) => set(t.key, { on: e.target.checked })} />
                      <span>
                        <b>{t.name}</b>
                        <small>{t.hint}</small>
                      </span>
                    </label>
                    <select className="input notify-hour" aria-label={`${t.name}: kdy`} value={p.hour} disabled={!p.on}
                      onChange={(e) => set(t.key, { hour: Number(e.target.value) })}>
                      {HOURS.map((h) => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                  </li>
                );
              })}
            </ul>
            <div className="notify-actions">
              <button className="btn" disabled={test.isPending} onClick={() => test.mutate()}>{test.isPending ? "Posílám…" : "Poslat zkušební"}</button>
              <button className="btn" disabled={disable.isPending} onClick={() => disable.mutate()}>Vypnout tady</button>
            </div>
            {test.isSuccess && <p className="note-ok">Odesláno, mělo by přijít během chvilky.</p>}
          </>
        )}
        {failure && <p className="error">Něco se nepovedlo ({failure.message}). Je spuštěné SQL a nasazená funkce untrois-push?</p>}
      </div>
    </section>
  );
}
