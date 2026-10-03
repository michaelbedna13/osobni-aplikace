import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Sheet } from "../components/Sheet";
import { Sprite } from "../components/Sprite";
import { isSameDay } from "../lib/dates";
import { plural } from "../lib/format";
import { MODULE_BY_KEY, type ModuleKey } from "../lib/modules";
import { describe, loadPlace, savePlace, searchCity, useWeather, type Place } from "../lib/weather";
import { useBreathSessions } from "../modules/dech/data";
import { balancesByPerson, debts, formatKc } from "../modules/finance/data";
import { reverseName } from "../modules/mista/data";
import { useMeditations } from "../modules/meditace/data";
import { computeStats, useBeers } from "../modules/piva/data";
import { useWorkouts } from "../modules/trenink/data";
import { computeGratitudeStats, useGratitude } from "../modules/vdecnost/data";

// ---------- souhrn dne ----------

function Tile({ module, value, label, done }: { module: ModuleKey; value: string; label: string; done: boolean }) {
  return (
    <Link to={`/m/${module}`} className={`sum-tile${done ? " done" : ""}`} style={{ "--accent": MODULE_BY_KEY[module].color } as CSSProperties} aria-label={`${MODULE_BY_KEY[module].name}: ${value} ${label}`}>
      <Sprite name={module} size={24} />
      <b>{value}</b>
      <span>{label}</span>
    </Link>
  );
}

/** Co už dnes je: piva, vděčnost, meditace, trénink, dýchání. */
export function DaySummary() {
  const { data: beers = [] } = useBeers();
  const { data: gratitude = [] } = useGratitude();
  const { data: meditations = [] } = useMeditations();
  const { data: workouts = [] } = useWorkouts();
  const { data: breaths = [] } = useBreathSessions();
  const now = new Date();
  const today = (iso: string) => isSameDay(new Date(iso), now);

  const beerCount = useMemo(() => computeStats(beers).today, [beers]);
  const thanks = useMemo(() => computeGratitudeStats(gratitude).today.length, [gratitude]);
  const medMin = Math.round(meditations.filter((m) => today(m.started_at)).reduce((s, m) => s + m.duration_s, 0) / 60);
  const trained = workouts.filter((w) => today(w.started_at)).length;
  const breathMin = Math.round(breaths.filter((b) => today(b.started_at)).reduce((s, b) => s + b.duration_s, 0) / 60);

  return (
    <section className="day-summary" aria-label="Dnešní souhrn">
      <Tile module="piva" value={String(beerCount)} label={plural(beerCount, ["pivo", "piva", "piv"])} done={beerCount > 0} />
      <Tile module="vdecnost" value={String(thanks)} label="vděčnost" done={thanks > 0} />
      <Tile module="meditace" value={medMin ? `${medMin}′` : "–"} label="meditace" done={medMin > 0} />
      <Tile module="trenink" value={trained ? `${trained}×` : "–"} label="trénink" done={trained > 0} />
      <Tile module="dech" value={breathMin ? `${breathMin}′` : "–"} label="dech" done={breathMin > 0} />
    </section>
  );
}

// ---------- dluhy ----------

export function DebtsToday() {
  const { data: ds = [] } = debts.useList();
  const balances = useMemo(() => balancesByPerson(ds), [ds]);
  if (balances.length === 0) return null;
  const owed = balances.filter((b) => b.balance > 0);
  const owe = balances.filter((b) => b.balance < 0);
  return (
    <section className="sec" style={{ "--accent": MODULE_BY_KEY.finance.color } as CSSProperties}>
      <div className="sec-head">
        <h2>Dluhy</h2>
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

export function WeatherCard() {
  const [place, setPlace] = useState<Place | null>(() => loadPlace());
  const [picking, setPicking] = useState(false);
  const { data: w, isLoading, error } = useWeather(place);
  const choose = (p: Place) => { savePlace(p); setPlace(p); setPicking(false); };

  if (!place) {
    return (
      <>
        <button className="panel weather-empty" onClick={() => setPicking(true)}>
          <Sprite name="w-partly" size={32} />
          <span className="grow"><b>Zapnout počasí</b><span className="small muted">podle polohy nebo města</span></span>
        </button>
        {picking && <PlaceSheet onClose={() => setPicking(false)} onChoose={choose} />}
      </>
    );
  }

  const d = w ? describe(w.code, w.isDay) : null;
  return (
    <section className="panel weather" aria-label="Počasí">
      {isLoading && <p className="small muted">Načítám počasí…</p>}
      {error && <p className="small muted">Počasí se teď nepodařilo načíst.</p>}
      {w && d && (
        <>
          <div className="weather-now">
            <Sprite name={d.icon} size={48} />
            <b className="weather-temp">{deg(w.temp)}</b>
            <div className="weather-desc">
              <b>{d.text}</b>
              <span>{deg(w.today.min)} / {deg(w.today.max)} · pocitově {deg(w.feels)}</span>
              <span>{w.today.rainChance ? `Déšť ${w.today.rainChance} %` : "Bez deště"} · vítr {Math.round(w.wind)} km/h</span>
            </div>
          </div>
          <ul className="weather-hours" aria-label="Po hodinách">
            {w.hours.filter((_, i) => i % 2 === 0).slice(0, 6).map((h) => (
              <li key={h.time.toISOString()}>
                <span>{hour(h.time)}</span>
                <Sprite name={describe(h.code, h.isDay).icon} size={20} />
                <b>{deg(h.temp)}</b>
                {h.rainChance >= 30 && <small>{h.rainChance} %</small>}
              </li>
            ))}
          </ul>
          <ul className="weather-days" aria-label="Další dny">
            {w.days.map((x) => (
              <li key={x.date.toISOString()}>
                <span>{weekday(x.date)}</span>
                <Sprite name={describe(x.code).icon} size={16} />
                <span>{deg(x.min)} / {deg(x.max)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="weather-foot">
        <button className="link inline" onClick={() => setPicking(true)}>{place.name}</button>
      </div>
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
