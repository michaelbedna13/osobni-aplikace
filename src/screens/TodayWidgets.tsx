import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Sheet } from "../components/Sheet";
import { Icon } from "../components/Icon";
import { MODULE_BY_KEY } from "../lib/modules";
import { describe, loadPlace, savePlace, searchCity, useWeather, type Place } from "../lib/weather";
import { balancesByPerson, debts, formatKc } from "../modules/finance/data";
import { reverseName } from "../modules/mista/data";

// ---------- dluhy ----------

export function DebtsToday() {
  const { data: ds = [] } = debts.useList();
  const balances = useMemo(() => balancesByPerson(ds), [ds]);
  if (balances.length === 0) return null;
  const owed = balances.filter((b) => b.balance > 0);
  const owe = balances.filter((b) => b.balance < 0);
  return (
    <section className="sec sec-tab" style={{ "--accent": MODULE_BY_KEY.finance.color, "--deep": MODULE_BY_KEY.finance.deep } as CSSProperties}>
      <div className="sec-head">
        <h2><Icon name="finance" size={26} />Dluhy</h2>
        <Link to="/m/finance?tab=dluhy" className="link">Vše</Link>
      </div>
      <div className="debt-grid">
        <div className="panel debt-col">
          <span className="small muted">Dluží mně</span>
          {owed.length ? owed.map((b) => <p key={b.person}><span>{b.person}</span><b className="money plus">{formatKc(b.balance)}</b></p>) : <p className="small muted">nikdo</p>}
        </div>
        <div className="panel debt-col">
          <span className="small muted">Dlužím já</span>
          {owe.length ? owe.map((b) => <p key={b.person}><span>{b.person}</span><b className="money minus">{formatKc(-b.balance)}</b></p>) : <p className="small muted">nikomu</p>}
        </div>
      </div>
    </section>
  );
}

// ---------- počasí ----------

const hour = (d: Date) => d.toLocaleTimeString("cs-CZ", { hour: "numeric" });
const weekday = (d: Date) => d.toLocaleDateString("cs-CZ", { weekday: "short" });
const deg = (n: number) => `${Math.round(n)}°`;

/** Počasí jako jeden řádek v hlavičce Dnes; ťuknutí otevře panel s předpovědí po hodinách a na další dny. */
export function WeatherCard() {
  const [place, setPlace] = useState<Place | null>(() => loadPlace());
  const [picking, setPicking] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: w, isLoading, error } = useWeather(place);
  const choose = (p: Place) => { savePlace(p); setPlace(p); setPicking(false); };

  if (!place) {
    return (
      <div className="weather">
        <button className="link inline weather-empty" onClick={() => setPicking(true)}>
          <Icon name="w-partly" size={20} /> Zapnout počasí
        </button>
        {picking && <PlaceSheet onClose={() => setPicking(false)} onChoose={choose} />}
      </div>
    );
  }

  const d = w ? describe(w.code, w.isDay) : null;
  return (
    <section className="weather" aria-label="Počasí">
      <div className="weather-row">
        {isLoading && <span className="small muted">Načítám počasí…</span>}
        {error && <span className="small muted">Počasí se nepodařilo načíst.</span>}
        {w && d && (
          <button className="weather-now" aria-expanded={open} aria-label={`${d.text}, ${deg(w.temp)}. Předpověď`} onClick={() => setOpen((o) => !o)}>
            <Icon name={d.icon} size={24} />
            <b className="weather-temp">{deg(w.temp)}</b>
            <span className="weather-desc">
              {d.text}, {deg(w.today.min)}–{deg(w.today.max)}{w.today.rainChance >= 30 ? `, déšť ${w.today.rainChance} %` : ""}
            </span>
          </button>
        )}
        {/* místo se mění v okně s předpovědí; tady jen když se počasí nenačetlo */}
        {!w && <button className="link inline weather-place" onClick={() => setPicking(true)}>Změnit místo</button>}
      </div>
      {w && d && open && (
        <Sheet title={`Počasí – ${place.name.split(",")[0]}`} onClose={() => setOpen(false)}>
          <p className="weather-extra">{d.text}, {deg(w.today.min)}–{deg(w.today.max)}. Pocitově {deg(w.feels)}, vítr {Math.round(w.wind)} km/h{w.today.rainChance ? `, déšť ${w.today.rainChance} %` : ""}.</p>
          <ul className="weather-hours" aria-label="Po hodinách">
            {w.hours.filter((_, i) => i % 2 === 0).slice(0, 6).map((h) => (
              <li key={h.time.toISOString()}>
                <span>{hour(h.time)}</span>
                <Icon name={describe(h.code, h.isDay).icon} size={20} />
                <b>{deg(h.temp)}</b>
                {h.rainChance >= 30 && <small>{h.rainChance} %</small>}
              </li>
            ))}
          </ul>
          <ul className="weather-days" aria-label="Další dny">
            {w.days.map((x) => (
              <li key={x.date.toISOString()}>
                <span>{weekday(x.date)}</span>
                <Icon name={describe(x.code).icon} size={16} />
                <span>{deg(x.min)} / {deg(x.max)}</span>
              </li>
            ))}
          </ul>
          <button className="link weather-change" onClick={() => { setOpen(false); setPicking(true); }}>Změnit místo</button>
        </Sheet>
      )}
      {picking && <PlaceSheet onClose={() => setPicking(false)} onChoose={choose} onRemove={() => { savePlace(null); setPlace(null); setPicking(false); }} />}
    </section>
  );
}

function PlaceSheet({ onClose, onChoose, onRemove }: { onClose: () => void; onChoose: (p: Place) => void; onRemove?: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const locate = () => {
    setErr(null);
    setBusy(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const found = await reverseName(lat, lng);
      setBusy(false);
      onChoose({ lat, lng, name: found?.address?.split(",")[0] ?? found?.name ?? "Moje poloha" });
    }, () => { setBusy(false); setErr("Polohu se nepodařilo zjistit. Zadej město."); }, { timeout: 10000, maximumAge: 600000 });
  };
  const search = async () => {
    if (q.trim().length < 2) return;
    setResults(await searchCity(q).catch(() => []));
  };

  return (
    <Sheet title="Počasí pro" onClose={onClose}>
      <button className="btn dark tap wide" onClick={locate} disabled={busy}>{busy ? "Zjišťuji polohu…" : "Podle mé polohy"}</button>
      <form className="inline-form" style={{ marginTop: 14 }} onSubmit={(e) => { e.preventDefault(); void search(); }}>
        <input className="input" aria-label="Město" placeholder="Město, třeba Kuřim" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn tap" type="submit">Hledat</button>
      </form>
      {err && <p className="error">{err}</p>}
      {results && (results.length ? (
        <ul className="list">
          {results.map((r) => <li key={`${r.lat}-${r.lng}`}><button className="list-btn" onClick={() => onChoose(r)}><span className="grow"><b>{r.name}</b></span></button></li>)}
        </ul>
      ) : <p className="small muted">Nic se nenašlo.</p>)}
      {onRemove && <button className="link" onClick={onRemove}>Vypnout počasí</button>}
      {/* licence dat CC BY 4.0 vyžaduje uvedení zdroje – stačí tady, mimo hlavní obrazovku */}
      <p className="weather-credit">Data o počasí: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo.com</a> (CC BY 4.0), modely DWD ICON a ECMWF</p>
    </Sheet>
  );
}
