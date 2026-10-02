import { useMemo, useState, type CSSProperties } from "react";
import { Burst } from "../../components/Burst";
import { BlockStacks, Columns, HBars } from "../../components/Charts";
import { Sheet } from "../../components/Sheet";
import { Sprite } from "../../components/Sprite";
import { useToast } from "../../components/Toast";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { beerCheer, beerHeadline } from "../../lib/copy";
import { relativeTime, toLocalInput, WEEKDAYS_SHORT } from "../../lib/dates";
import { formatDate, formatNumber, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { computeStats, newBeer, useAddBeer, useBeers, useDeleteBeer, useUpdateBeer, type Beer } from "./data";

const MODULE = MODULE_BY_KEY.piva;
const PIV: [string, string, string] = ["pivo", "piva", "piv"];
const WEEKDAYS_LONG_CAP = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];

/** Hook pro +1 s potvrzením a možností vrátit. Používá ho i karta na obrazovce Dnes. */
export function useBeerCounter() {
  const add = useAddBeer();
  const remove = useDeleteBeer();
  const toast = useToast();

  const addOne = (todayBefore: number) => {
    const beer = newBeer();
    add.mutate(beer);
    toast.show(`${todayBefore + 1}. pivo dnes zapsáno`, [{ label: "Vrátit", run: () => remove.mutate(beer.id) }]);
  };

  return { addOne, toast: toast.element, error: add.error ?? remove.error };
}

export function PivaScreen() {
  const { data: beers = [], isLoading, error } = useBeers();
  const stats = useMemo(() => computeStats(beers), [beers]);
  const counter = useBeerCounter();
  const [mode, setMode] = useState<"average" | "total">("average");
  const [editing, setEditing] = useState<Beer | "new" | null>(null);
  const [jump, setJump] = useState(0);
  const [cheer, setCheer] = useState<string | null>(null);
  const [tab, setTab] = useState<"tyden" | "statistiky" | "listek">("tyden");

  const weekdayValues = stats.byWeekday.map((d) => (mode === "average" ? d.average : d.total));
  const topDay = weekdayValues.reduce((best, v, i) => (v > weekdayValues[best] ? i : best), 0);
  const leaders = weekdayValues.map((v, i) => (Math.abs(v - weekdayValues[topDay]) < 0.05 ? i : -1)).filter((i) => i >= 0);
  const hasData = stats.total > 0;

  const addOne = () => {
    counter.addOne(stats.today);
    setCheer(beerCheer(stats.today + 1));
    setJump((j) => j + 1);
  };

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Piva" />
        <div className="hero" aria-live="polite">
          <span key={jump} className={`sprite-tile ${jump ? "anim-jump" : ""}`}><Sprite name="piva" size={96} /></span>
          <Burst trigger={jump} text="+1" />
          <span className="hero-num">{stats.today}</span>
          <span className="hero-cap">{beerHeadline(stats.today)}</span>
          <p className="hero-line">{cheer ?? `Tento týden ${stats.week} ${plural(stats.week, PIV)}`}</p>
        </div>
        <button className="btn-hero" onClick={addOne}>
          <Sprite name="i-plus" size={24} /> 1 pivo
        </button>
      </div>

      {(error || counter.error) && <p className="error">Nepodařilo se načíst nebo uložit data. Zkontroluj připojení.</p>}

      <div className="score">
        <div><b>{stats.week}</b><span>tento týden</span></div>
        <div><b>{stats.month}</b><span>tento měsíc</span></div>
        <div><b>{stats.total}</b><span>celkem</span></div>
      </div>

      <Tabs
        label="Zobrazení"
        value={tab}
        onChange={setTab}
        items={[{ id: "tyden", label: "Týden" }, { id: "statistiky", label: "Statistiky" }, { id: "listek", label: "Lístek" }]}
      />

      {tab === "tyden" && (
        <div className="tab-panel">
          <div className="panel">
            <h3>Tento týden po dnech</h3>
            <BlockStacks
              values={stats.thisWeek}
              labels={WEEKDAYS_SHORT.map((d, i) => (i === stats.todayIndex ? "Dnes" : d))}
              highlight={stats.todayIndex}
              color={MODULE.color}
              label={`Piva tento týden po dnech: ${stats.thisWeek.map((v, i) => `${WEEKDAYS_SHORT[i]} ${v ?? "–"}`).join(", ")}`}
            />
          </div>
        </div>
      )}

      {tab === "statistiky" && (
        <div className="tab-panel">
          {!hasData ? (
            <p className="empty">Statistiky se ukážou po prvním pivu.</p>
          ) : (
            <>
              <div className="panel">
                <div className="row-between">
                  <h3>Kdy piju nejvíc</h3>
                  <div className="seg" role="group" aria-label="Zobrazit">
                    <button className={`seg-btn${mode === "average" ? " on" : ""}`} aria-pressed={mode === "average"} onClick={() => setMode("average")}>Průměr</button>
                    <button className={`seg-btn${mode === "total" ? " on" : ""}`} aria-pressed={mode === "total"} onClick={() => setMode("total")}>Celkem</button>
                  </div>
                </div>
                <p className="lead">
                  {leaders.length > 1
                    ? `Remíza: ${leaders.map((i) => WEEKDAYS_LONG_CAP[i].toLowerCase()).join(" a ")}, `
                    : `${WEEKDAYS_LONG_CAP[topDay]} vede: `}
                  {mode === "average"
                    ? `průměrně ${formatNumber(weekdayValues[topDay])} ${plural(weekdayValues[topDay], PIV)}`
                    : `celkem ${weekdayValues[topDay]} ${plural(weekdayValues[topDay], PIV)}`}
                </p>
                <HBars
                  rows={weekdayValues.map((value, i) => ({ label: WEEKDAYS_SHORT[i], value }))}
                  highlight={topDay}
                  color={MODULE.color}
                  digits={mode === "average" ? 1 : 0}
                  badge={<Sprite name="crown" size={28} />}
                  label={`Piva podle dne v týdnu (${mode === "average" ? "průměr" : "celkem"})`}
                />
              </div>

              <div className="panel">
                <h3>Posledních 12 týdnů</h3>
                <Columns
                  values={stats.lastWeeks.map((w) => w.count)}
                  labels={stats.lastWeeks.map((w, i) => (i === 11 ? "teď" : i % 3 === 2 ? formatDate(w.start) : ""))}
                  highlight={11}
                  color={MODULE.color}
                  label={`Piva po týdnech: ${stats.lastWeeks.map((w) => `od ${formatDate(w.start)} ${w.count}`).join(", ")}`}
                />
              </div>

              <div className="trophies">
                {stats.bestDay && (
                  <div className="trophy gold">
                    <Sprite name="trophy" size={40} />
                    <b>{stats.bestDay.count}</b>
                    <span>nejvíc za den ({formatDate(stats.bestDay.date, true)})</span>
                  </div>
                )}
                {stats.bestWeek && (
                  <div className="trophy">
                    <Sprite name="star" size={40} />
                    <b>{stats.bestWeek.count}</b>
                    <span>nejvíc za týden (od {formatDate(stats.bestWeek.start)})</span>
                  </div>
                )}
                <div className="trophy">
                  <b>{formatNumber(stats.perDay)}</b>
                  <span>průměrně za den</span>
                </div>
                <div className="trophy">
                  <b>{formatNumber(stats.perWeek)}</b>
                  <span>průměrně za týden</span>
                </div>
              </div>
              {stats.firstDate && <p className="small note">Počítáno od {formatDate(stats.firstDate, true)}.</p>}
            </>
          )}
        </div>
      )}

      {tab === "listek" && (
        <div className="tab-panel">
          <div className="row-between">
            <p className="small">Ťukni na zápis a uprav čas nebo ho smaž.</p>
            <button className="link" onClick={() => setEditing("new")}>Přidat zpětně</button>
          </div>
          {isLoading ? (
            <p>Načítám…</p>
          ) : hasData ? (
            <ul className="list">
              {beers.slice(0, 30).map((b) => (
                <li key={b.id}>
                  <button className="list-btn" onClick={() => setEditing(b)}>
                    <Sprite name="piva" size={24} />
                    <span className="grow">{relativeTime(new Date(b.drunk_at))}</span>
                    <span className="small">Upravit</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">Zatím prázdný lístek. Ťukni na „+1 pivo“.</p>
          )}
        </div>
      )}

      {editing && <BeerTimeSheet beer={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {counter.toast}
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
