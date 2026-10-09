import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Icon } from "../../components/Icon";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { addDays, startOfDay, WEEKDAYS_SHORT } from "../../lib/dates";
import { formatDate, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { computeGratitudeStats, dayKey, fromDayKey, useDeleteGratitude, useGratitude, useUpdateGratitude, type Gratitude } from "./data";
import { GratitudeForm } from "./GratitudeForm";

const MODULE = MODULE_BY_KEY.vdecnost;
const DNI: [string, string, string] = ["den", "dny", "dní"];
const DAYS_SHOWN = 10;

/** „Dnes“, „Včera“, „Út 29. 9.“, „12. 9. 2025“ */
export function dayLabel(key: string, now = new Date()) {
  const today = startOfDay(now);
  if (key === dayKey(today)) return "Dnes";
  if (key === dayKey(addDays(today, -1))) return "Včera";
  const d = fromDayKey(key);
  if (d.getFullYear() !== today.getFullYear()) return formatDate(d, true);
  return `${WEEKDAYS_SHORT[(d.getDay() + 6) % 7]} ${formatDate(d)}`;
}

export function VdecnostScreen() {
  const { data: list = [], isLoading, error } = useGratitude();
  const stats = useMemo(() => computeGratitudeStats(list), [list]);
  const [params, setParams] = useSearchParams();
  const [autoFocus] = useState(() => params.has("nova"));
  const [tab, setTab] = useState<"zapisy" | "prehled">("zapisy");
  const [cheer, setCheer] = useState<string | null>(null);
  const [jump, setJump] = useState(0);
  const [editing, setEditing] = useState<Gratitude | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (params.has("nova")) setParams({}, { replace: true });
  }, [params, setParams]);

  const days = useMemo(() => {
    const groups: { key: string; items: Gratitude[] }[] = [];
    for (const g of list) {
      const last = groups[groups.length - 1];
      if (last?.key === g.day) last.items.push(g);
      else groups.push({ key: g.day, items: [g] });
    }
    return groups;
  }, [list]);

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Vděčnost" />
        <div className="hero" aria-live="polite">
          <span key={jump} className={`icon-slot${jump ? " anim-jump" : ""}`}><Icon name="vdecnost" size={96} /></span>
          <span className="hero-num">{stats.streak}</span>
          <span className="hero-cap">{plural(stats.streak, DNI)} v řadě</span>
          <p className="hero-line">
            {cheer ?? (stats.today.length ? `Dnes zapsáno ${stats.today.length}×` : "Za co jsi dnes vděčný?")}
          </p>
        </div>
        <GratitudeForm
          todayCount={stats.today.length}
          autoFocus={autoFocus}
          onSaved={(line) => { setCheer(line); setJump((j) => j + 1); }}
        />
      </div>

      {error && <p className="error">Nepodařilo se načíst zápisy. Zkontroluj připojení.</p>}

      <div className="score">
        <div><b>{stats.weekDays}/7</b><span>dní tento týden</span></div>
        <div><b>{stats.monthCount}</b><span>{plural(stats.monthCount, ["zápis", "zápisy", "zápisů"])} v měsíci</span></div>
        <div><b>{stats.bestStreak}</b><span>nejdelší série</span></div>
      </div>

      <Tabs label="Zobrazení" value={tab} onChange={setTab} items={[{ id: "zapisy", label: "Zápisy" }, { id: "prehled", label: "Přehled" }]} />

      {tab === "zapisy" && (
        <div className="tab-panel">
          {isLoading ? <p>Načítám…</p> : days.length === 0 ? (
            <p className="empty">Zatím prázdno. První věc, za kterou jsi vděčný, zapiš nahoře.</p>
          ) : (showAll ? days : days.slice(0, DAYS_SHOWN)).map((day) => (
            <section key={day.key}>
              <h3 className="history-label"><span>{dayLabel(day.key)}</span><span className="muted">{day.items.length}×</span></h3>
              <ul className="list">
                {day.items.map((g) => (
                  <li key={g.id}>
                    <button className="list-btn thanks-item" onClick={() => setEditing(g)} aria-label={`Upravit: ${g.text}`}>
                      <Icon name="heart" size={20} tone="trenink" />
                      <span className="grow">{g.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {!showAll && days.length > DAYS_SHOWN && (
            <button className="btn tap wide" onClick={() => setShowAll(true)}>Starší zápisy ({days.length - DAYS_SHOWN} dní)</button>
          )}
        </div>
      )}

      {tab === "prehled" && (
        <div className="tab-panel">
          <div className="panel">
            <h3>Posledních 12 týdnů</h3>
            <Mosaic weeks={stats.mosaic} />
          </div>
          {(stats.yearAgo.length > 0 || stats.memory) && (
            <div className="panel">
              <h3>{stats.yearAgo.length ? "Před rokem" : `Vzpomínka z ${dayLabel(stats.memory!.day).toLowerCase()}`}</h3>
              <ul className="thanks-list">
                {(stats.yearAgo.length ? stats.yearAgo : [stats.memory!]).map((g) => <li key={g.id}>{g.text}</li>)}
              </ul>
            </div>
          )}
          <div className="trophies">
            <div className="trophy"><b>{stats.total}</b><span>{plural(stats.total, ["zápis", "zápisy", "zápisů"])} celkem</span></div>
            <div className="trophy"><b>{stats.totalDays}</b><span>{plural(stats.totalDays, DNI)} se zápisem</span></div>
          </div>
        </div>
      )}

      {editing && <EditSheet entry={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

/** Mozaika: sloupec = týden, řádek = den v týdnu. Barva podle počtu zápisů. */
function Mosaic({ weeks }: { weeks: (number | null)[][] }) {
  const filled = weeks.flat().filter((v) => v).length;
  return (
    <figure className="mosaic" role="img" aria-label={`Dní se zápisem za posledních 12 týdnů: ${filled}`}>
      <div className="mosaic-days" aria-hidden="true">{WEEKDAYS_SHORT.map((d, i) => <span key={d}>{i % 2 === 0 ? d : ""}</span>)}</div>
      <div className="mosaic-grid">
        {weeks.map((week, w) => (
          <div key={w} className="mosaic-week">
            {week.map((v, i) => <i key={i} className={v === null ? "future" : v >= 2 ? "lvl2" : v === 1 ? "lvl1" : undefined} />)}
          </div>
        ))}
      </div>
      <figcaption className="mosaic-legend small">
        <i /> nic <i className="lvl1" /> 1 <i className="lvl2" /> 2 a víc
      </figcaption>
    </figure>
  );
}

function EditSheet({ entry, onClose }: { entry: Gratitude; onClose: () => void }) {
  const [text, setText] = useState(entry.text);
  const update = useUpdateGratitude();
  const remove = useDeleteGratitude();
  const valid = text.trim().length > 0;
  return (
    <Sheet title={`Upravit zápis (${dayLabel(entry.day).toLowerCase()})`} onClose={onClose}>
      <label htmlFor="thanks-edit" className="sr-only">Text</label>
      <textarea id="thanks-edit" className="input" rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
      <button className="btn dark tap wide" disabled={!valid} onClick={() => { update.mutate({ ...entry, text: text.trim() }); onClose(); }}>Uložit</button>
      <button className="btn tap wide" onClick={() => { remove.mutate(entry.id); onClose(); }}>Smazat zápis</button>
    </Sheet>
  );
}
