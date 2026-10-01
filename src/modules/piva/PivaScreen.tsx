import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart } from "../../components/BarChart";
import { BackIcon } from "../../components/Icons";
import { Sheet } from "../../components/Sheet";
import { Symbol } from "../../components/Symbol";
import { useToast } from "../../components/Toast";
import { relativeTime, toLocalInput, WEEKDAYS_SHORT } from "../../lib/dates";
import { formatDate, formatNumber, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { computeStats, newBeer, useAddBeer, useBeers, useDeleteBeer, useUpdateBeer, type Beer } from "./data";

const COLOR = MODULE_BY_KEY.piva.color;
const PIV: [string, string, string] = ["pivo", "piva", "piv"];
const WEEKDAYS_LONG = ["pondělí", "úterý", "středu", "čtvrtek", "pátek", "sobotu", "neděli"];

/** Hook pro +1 s potvrzením a možností vrátit. Používá ho i karta na obrazovce Dnes. */
export function useBeerCounter() {
  const add = useAddBeer();
  const remove = useDeleteBeer();
  const toast = useToast();

  const addOne = (todayBefore: number) => {
    const beer = newBeer();
    add.mutate(beer);
    toast.show(`Zapsáno: ${todayBefore + 1}. pivo dnes`, [{ label: "Zpět", run: () => remove.mutate(beer.id) }]);
  };

  return { addOne, toast: toast.element, error: add.error ?? remove.error };
}

export function PivaScreen() {
  const { data: beers = [], isLoading, error } = useBeers();
  const stats = useMemo(() => computeStats(beers), [beers]);
  const counter = useBeerCounter();
  const [mode, setMode] = useState<"average" | "total">("average");
  const [editing, setEditing] = useState<Beer | "new" | null>(null);

  const weekdayValues = stats.byWeekday.map((d) => (mode === "average" ? d.average : d.total));
  const topDay = weekdayValues.reduce((best, v, i) => (v > weekdayValues[best] ? i : best), 0);
  const hasData = stats.total > 0;

  return (
    <div className="screen">
      <header className="poster beer-poster" style={{ background: COLOR }}>
        <span className="poster-art"><Symbol module="piva" size={170} bg="#FFFFFF" /></span>
        <div className="poster-title">
          <Link to="/moduly" className="back" aria-label="Zpět na moduly"><BackIcon /></Link>
          <h1>Piva</h1>
        </div>
        <div className="beer-hero" aria-live="polite">
          <span className="big-num">{stats.today}</span>
          <span className="beer-hero-sub">{plural(stats.today, PIV)} dnes, tento týden {stats.week}</span>
        </div>
      </header>

      <div className="pad">
        <button className="plus-one" onClick={() => counter.addOne(stats.today)}>
          <Symbol module="piva" size={34} /> +1 pivo
        </button>

        {(error || counter.error) && <p className="error">Nepodařilo se načíst nebo uložit data. Zkontroluj připojení.</p>}

        <div className="stat-grid">
          <Stat label="Tento týden" value={stats.week} />
          <Stat label="Tento měsíc" value={stats.month} />
          <Stat label="Letos" value={stats.year} />
          <Stat label="Celkem" value={stats.total} />
        </div>

        <section className="card chart-card">
          <h2 className="card-title">Tento týden</h2>
          <BarChart
            values={stats.thisWeek}
            labels={WEEKDAYS_SHORT.map((d, i) => (i === stats.todayIndex ? "Dnes" : d))}
            highlight={stats.todayIndex}
            color={COLOR}
            label={`Piva tento týden po dnech: ${stats.thisWeek.map((v, i) => `${WEEKDAYS_SHORT[i]} ${v ?? "–"}`).join(", ")}`}
          />
        </section>

        {hasData && (
          <>
            <section className="card chart-card">
              <div className="row-between">
                <h2 className="card-title">Podle dne v týdnu</h2>
                <div className="seg" role="group" aria-label="Zobrazit">
                  <button className={`seg-btn${mode === "average" ? " on" : ""}`} aria-pressed={mode === "average"} onClick={() => setMode("average")}>Průměr</button>
                  <button className={`seg-btn${mode === "total" ? " on" : ""}`} aria-pressed={mode === "total"} onClick={() => setMode("total")}>Celkem</button>
                </div>
              </div>
              <p className="muted small">
                Nejvíc piješ v {WEEKDAYS_LONG[topDay]}:{" "}
                {mode === "average"
                  ? `průměrně ${formatNumber(weekdayValues[topDay])} ${plural(weekdayValues[topDay], PIV)}`
                  : `celkem ${weekdayValues[topDay]} ${plural(weekdayValues[topDay], PIV)}`}
              </p>
              <BarChart
                values={weekdayValues}
                labels={WEEKDAYS_SHORT}
                highlight={topDay}
                color={COLOR}
                format={(n) => formatNumber(n)}
                label={`Piva podle dne v týdnu (${mode === "average" ? "průměr" : "celkem"}): ${weekdayValues.map((v, i) => `${WEEKDAYS_SHORT[i]} ${formatNumber(v)}`).join(", ")}`}
              />
            </section>

            <section className="card chart-card">
              <h2 className="card-title">Posledních 12 týdnů</h2>
              <BarChart
                values={stats.lastWeeks.map((w) => w.count)}
                labels={stats.lastWeeks.map((w, i) => (i === 11 ? "Teď" : i % 3 === 2 ? formatDate(w.start) : ""))}
                highlight={11}
                color={COLOR}
                label={`Piva po týdnech: ${stats.lastWeeks.map((w) => `od ${formatDate(w.start)} ${w.count}`).join(", ")}`}
              />
            </section>

            <section className="card">
              <h2 className="card-title">Průměr a rekordy</h2>
              <dl className="facts">
                <div><dt>Průměrně za den</dt><dd>{formatNumber(stats.perDay)}</dd></div>
                <div><dt>Průměrně za týden</dt><dd>{formatNumber(stats.perWeek)}</dd></div>
                {stats.bestDay && <div><dt>Nejvíc za den</dt><dd>{stats.bestDay.count} <span className="muted small">({formatDate(stats.bestDay.date, true)})</span></dd></div>}
                {stats.bestWeek && <div><dt>Nejvíc za týden</dt><dd>{stats.bestWeek.count} <span className="muted small">(od {formatDate(stats.bestWeek.start, true)})</span></dd></div>}
                {stats.firstDate && <div><dt>Počítáno od</dt><dd>{formatDate(stats.firstDate, true)}</dd></div>}
              </dl>
            </section>
          </>
        )}

        <div className="row-between list-head">
          <h2 className="sec-title">Poslední zápisy</h2>
          <button className="link" onClick={() => setEditing("new")}>Přidat zpětně</button>
        </div>
        {isLoading ? (
          <p className="muted">Načítám…</p>
        ) : hasData ? (
          <ul className="card list">
            {beers.slice(0, 20).map((b) => (
              <li key={b.id}>
                <button className="list-btn" onClick={() => setEditing(b)}>
                  <Symbol module="piva" size={22} />
                  <span className="grow">{relativeTime(new Date(b.drunk_at))}</span>
                  <span className="muted small">Upravit</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Zatím žádné pivo. Ťukni na „+1 pivo“.</p>
        )}
      </div>

      {editing && <BeerTimeSheet beer={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {counter.toast}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <span className="stat-num">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

/** Úprava času zápisu, smazání, nebo přidání piva zpětně. */
function BeerTimeSheet({ beer, onClose }: { beer: Beer | null; onClose: () => void }) {
  const [value, setValue] = useState(toLocalInput(beer ? new Date(beer.drunk_at) : new Date()));
  const add = useAddBeer();
  const update = useUpdateBeer();
  const remove = useDeleteBeer();
  const valid = !Number.isNaN(new Date(value).getTime()) && new Date(value) <= new Date();

  const save = () => {
    const when = new Date(value);
    if (beer) update.mutate({ ...beer, drunk_at: when.toISOString() });
    else add.mutate(newBeer(when));
    onClose();
  };

  return (
    <Sheet title={beer ? "Upravit zápis" : "Přidat pivo zpětně"} onClose={onClose}>
      <label htmlFor="beer-time" className="field-label">Kdy</label>
      <input id="beer-time" className="input" type="datetime-local" value={value} max={toLocalInput(new Date())} onChange={(e) => setValue(e.target.value)} />
      {!valid && <p className="error">Zadej čas, který už proběhl.</p>}
      <button className="btn dark tap wide" disabled={!valid} onClick={save}>{beer ? "Uložit" : "Přidat pivo"}</button>
      {beer && (
        <button className="btn tap wide" onClick={() => { remove.mutate(beer.id); onClose(); }}>Smazat zápis</button>
      )}
    </Sheet>
  );
}
