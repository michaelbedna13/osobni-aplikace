import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BarChart } from "../../components/BarChart";
import { BackIcon } from "../../components/Icons";
import { Sheet } from "../../components/Sheet";
import { Symbol } from "../../components/Symbol";
import { useToast } from "../../components/Toast";
import { addDays, relativeTime, startOfWeek, toLocalInput, WEEKDAYS_SHORT } from "../../lib/dates";
import { formatDate, formatNumber, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useSettings } from "../../lib/settings";
import { playGong, unlockAudio } from "../../lib/sound";
import { useWakeLock } from "../../lib/wakeLock";
import {
  computeMeditationStats, formatDuration, useAddMeditation, useDeleteMeditation, useMeditations, useUpdateMeditation, type Meditation,
} from "./data";
import {
  elapsedSeconds, finalSeconds, isFinished, loadLastMinutes, loadTimer, pauseTimer, resumeTimer, saveLastMinutes, saveTimer, startTimer, type TimerState,
} from "./timer";

const MODULE = MODULE_BY_KEY.meditace;
const DURATIONS = [5, 10, 15, 20, 30, 0]; // 0 = bez omezení
const KRAT: [string, string, string] = ["meditace", "meditace", "meditací"];

export function MeditaceScreen() {
  const [timer, setTimerState] = useState<TimerState | null>(loadTimer);
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const add = useAddMeditation();

  const setTimer = useCallback((next: TimerState | null) => {
    saveTimer(next);
    setTimerState(next);
  }, []);

  const start = useCallback((minutes: number) => {
    unlockAudio();
    saveLastMinutes(minutes);
    setTimer(startTimer(minutes ? minutes * 60 : null));
    playGong();
  }, [setTimer]);

  const finish = useCallback((state: TimerState, { gong }: { gong: boolean }) => {
    setTimer(null);
    const seconds = finalSeconds(state);
    if (gong) playGong();
    if (seconds < 30) {
      toast.show("Meditace kratší než 30 s se neukládá");
      return;
    }
    add.mutate({ id: crypto.randomUUID(), started_at: state.startedAt, duration_s: seconds, note: null });
    toast.show(`Uloženo: ${formatDuration(seconds)}`);
  }, [add, setTimer, toast]);

  // ?start=1 z obrazovky Dnes spustí meditaci s naposledy zvolenou délkou
  const wantsStart = params.has("start");
  useEffect(() => {
    if (!wantsStart) return;
    setParams({}, { replace: true });
    if (!loadTimer()) start(loadLastMinutes());
  }, [wantsStart, setParams, start]);

  return (
    <>
      {timer ? (
        <TimerView
          timer={timer}
          onPause={() => setTimer(pauseTimer(timer))}
          onResume={() => { unlockAudio(); setTimer(resumeTimer(timer)); }}
          onFinish={(gong) => finish(timer, { gong })}
          onCancel={() => setTimer(null)}
        />
      ) : (
        <Overview onStart={start} />
      )}
      {toast.element}
    </>
  );
}

function TimerView({ timer, onPause, onResume, onFinish, onCancel }: {
  timer: TimerState;
  onPause: () => void;
  onResume: () => void;
  onFinish: (gong: boolean) => void;
  onCancel: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const finishing = useRef(false);
  const running = timer.runningSince !== null;
  useWakeLock(running);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  // Konec plánované délky – i po návratu do appky; gong jen když jsme u toho
  useEffect(() => {
    if (finishing.current || !isFinished(timer, now)) return;
    finishing.current = true;
    const overdue = timer.plannedSeconds !== null && elapsedSeconds(timer, now) - timer.plannedSeconds > 5;
    onFinish(!overdue);
  }, [now, timer, onFinish]);

  const elapsed = elapsedSeconds(timer, now);
  const shown = timer.plannedSeconds === null ? elapsed : Math.max(0, timer.plannedSeconds - elapsed);
  const pct = timer.plannedSeconds === null ? (elapsed % 60) / 60 : Math.min(1, elapsed / timer.plannedSeconds);
  const mm = String(Math.floor(shown / 60)).padStart(2, "0");
  const ss = String(Math.floor(shown % 60)).padStart(2, "0");

  return (
    <div className="screen meditating" style={{ background: MODULE.color }}>
      <div className="pad">
        <div className="poster-title">
          <h1>Meditace</h1>
        </div>
        <div className="timer" role="timer" aria-label={`${timer.plannedSeconds === null ? "Uplynulo" : "Zbývá"} ${mm}:${ss}`}>
          <svg viewBox="0 0 100 100" width="260" height="260" aria-hidden="true">
            <defs><clipPath id="timer-clip"><circle cx="50" cy="50" r="46" /></clipPath></defs>
            <circle cx="50" cy="50" r="46" fill="#FFFFFF" />
            <rect x="0" y={100 - pct * 100} width="100" height={pct * 100} fill={MODULE.deep} clipPath="url(#timer-clip)" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="#000" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="timer-time">
            <b>{mm}:{ss}</b>
            <span>{timer.plannedSeconds === null ? "bez omezení" : `z ${formatDuration(timer.plannedSeconds)}`}</span>
          </div>
        </div>
        <p className="timer-state" aria-live="polite">{running ? "Dýchej. Displej zůstane rozsvícený." : "Pozastaveno"}</p>
        <div className="timer-actions">
          {running
            ? <button className="btn tap" onClick={onPause}>Pozastavit</button>
            : <button className="btn tap" onClick={onResume}>Pokračovat</button>}
          <button className="btn dark tap" onClick={() => { finishing.current = true; onFinish(true); }}>Ukončit a uložit</button>
        </div>
        <button className="link timer-cancel" onClick={onCancel}>Zrušit bez uložení</button>
      </div>
    </div>
  );
}

function Overview({ onStart }: { onStart: (minutes: number) => void }) {
  const { data: list = [], isLoading, error } = useMeditations();
  const { settings, update } = useSettings();
  const goal = settings.meditation_weekly_goal;
  const stats = useMemo(() => computeMeditationStats(list, goal), [list, goal]);
  const [minutes, setMinutes] = useState(loadLastMinutes);
  const [editing, setEditing] = useState<Meditation | "new" | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);

  const weeks = useMemo(() => groupByWeek(list.slice(0, 60)), [list]);

  return (
    <div className="screen">
      <header className="poster" style={{ background: MODULE.color }}>
        <span className="poster-art"><Symbol module="meditace" size={170} bg="#FFFFFF" /></span>
        <div className="quote-hero">
          <div className="poster-title">
            <Link to="/moduly" className="back" aria-label="Zpět na moduly"><BackIcon /></Link>
            <h1>Meditace</h1>
          </div>
          <p className="beer-hero-sub">Tento týden {stats.weekCount} z {goal}, {formatDuration(stats.weekMinutes * 60)}</p>
        </div>
      </header>

      <div className="pad">
        <div className="durations" role="group" aria-label="Délka meditace">
          {DURATIONS.map((d) => (
            <button key={d} className={`chip${minutes === d ? " on" : ""}`} aria-pressed={minutes === d} onClick={() => setMinutes(d)}>
              {d ? `${d} min` : "Bez omezení"}
            </button>
          ))}
        </div>
        <button className="plus-one" onClick={() => onStart(minutes)}>
          <Symbol module="meditace" size={34} /> Začít meditaci
        </button>

        {error && <p className="error">Nepodařilo se načíst meditace. Zkontroluj připojení.</p>}

        <section className="card goal-card">
          <div className="row-between">
            <h2 className="card-title">Cíl: {goal}× týdně</h2>
            <button className="link" onClick={() => setGoalOpen(true)}>Změnit</button>
          </div>
          <div className="week-dots">
            {WEEKDAYS_SHORT.map((d, i) => {
              const v = stats.thisWeek[i];
              return (
                <div key={d} className="week-dot">
                  <span className={`dot${v === null ? " future" : v > 0 ? " done" : ""}`} style={v ? { background: MODULE.deep } : undefined} aria-hidden="true" />
                  <span className={i === stats.todayIndex ? "today" : undefined}>{d}</span>
                  <span className="sr-only">{v === null ? "ještě nebylo" : v > 0 ? `${v} min` : "bez meditace"}</span>
                </div>
              );
            })}
          </div>
          <p className="muted small">
            {stats.weekCount >= goal ? "Cíl na tento týden je splněný." : `Do cíle zbývá ${goal - stats.weekCount}×.`}
            {stats.weekStreak > 0 && ` Série: ${stats.weekStreak} ${plural(stats.weekStreak, ["týden", "týdny", "týdnů"])} v řadě.`}
          </p>
        </section>

        {stats.totalCount > 0 && (
          <>
            <div className="stat-grid">
              <Stat label="Minut tento týden" value={formatNumber(stats.weekMinutes, 0)} />
              <Stat label="Minut tento měsíc" value={formatNumber(stats.monthMinutes, 0)} />
              <Stat label="Hodin celkem" value={formatNumber(stats.totalMinutes / 60)} />
              <Stat label="Průměrná délka" value={`${formatNumber(stats.averageMinutes, 0)} min`} />
            </div>

            <section className="card chart-card">
              <h2 className="card-title">Minuty za posledních 12 týdnů</h2>
              <BarChart
                values={stats.lastWeeks.map((w) => w.minutes)}
                labels={stats.lastWeeks.map((w, i) => (i === 11 ? "Teď" : i % 3 === 2 ? formatDate(w.start) : ""))}
                highlight={11}
                color={MODULE.deep!}
                label={`Minuty meditace po týdnech: ${stats.lastWeeks.map((w) => `od ${formatDate(w.start)} ${w.minutes}`).join(", ")}`}
              />
            </section>

            <section className="card">
              <h2 className="card-title">Souhrn</h2>
              <dl className="facts">
                <div><dt>Meditací celkem</dt><dd>{stats.totalCount}</dd></div>
                {stats.longest && (
                  <div><dt>Nejdelší</dt><dd>{formatDuration(stats.longest.duration_s)} <span className="muted small">({formatDate(new Date(stats.longest.started_at), true)})</span></dd></div>
                )}
              </dl>
            </section>
          </>
        )}

        <div className="row-between list-head">
          <h2 className="sec-title">Historie</h2>
          <button className="link" onClick={() => setEditing("new")}>Přidat zpětně</button>
        </div>
        {isLoading ? (
          <p className="muted">Načítám…</p>
        ) : list.length === 0 ? (
          <p className="muted">Zatím žádná meditace. Vyber délku a ťukni na „Začít meditaci“.</p>
        ) : (
          weeks.map((w) => (
            <section key={w.label} className="history-week">
              <h3 className="history-label">
                {w.label} <span className="muted">{w.items.length} {plural(w.items.length, KRAT)}, {formatDuration(w.seconds)}</span>
              </h3>
              <ul className="card list">
                {w.items.map((m) => (
                  <li key={m.id}>
                    <button className="list-btn" onClick={() => setEditing(m)}>
                      <Symbol module="meditace" size={22} />
                      <span className="grow">{relativeTime(new Date(m.started_at))}{m.note ? <span className="muted small"> {m.note}</span> : null}</span>
                      <b>{formatDuration(m.duration_s)}</b>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {editing && <MeditationSheet meditation={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {goalOpen && (
        <GoalSheet goal={goal} onClose={() => setGoalOpen(false)} onSave={(g) => update({ meditation_weekly_goal: g })} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-num">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function groupByWeek(list: Meditation[]) {
  const thisWeek = startOfWeek(new Date()).getTime();
  const groups: { label: string; seconds: number; items: Meditation[] }[] = [];
  for (const m of list) {
    const week = startOfWeek(new Date(m.started_at));
    const t = week.getTime();
    const label = t === thisWeek ? "Tento týden" : t === addDays(new Date(thisWeek), -7).getTime() ? "Minulý týden" : `Týden od ${formatDate(week, week.getFullYear() !== new Date().getFullYear())}`;
    let group = groups[groups.length - 1];
    if (!group || group.label !== label) groups.push((group = { label, seconds: 0, items: [] }));
    group.items.push(m);
    group.seconds += m.duration_s;
  }
  return groups;
}

function MeditationSheet({ meditation, onClose }: { meditation: Meditation | null; onClose: () => void }) {
  const [when, setWhen] = useState(toLocalInput(meditation ? new Date(meditation.started_at) : new Date()));
  const [minutes, setMinutes] = useState(meditation ? String(Math.round(meditation.duration_s / 60)) : "10");
  const [note, setNote] = useState(meditation?.note ?? "");
  const add = useAddMeditation();
  const update = useUpdateMeditation();
  const remove = useDeleteMeditation();
  const date = new Date(when);
  const mins = Number(minutes);
  const valid = !Number.isNaN(date.getTime()) && date <= new Date() && Number.isFinite(mins) && mins >= 1 && mins <= 600;

  const save = () => {
    // když se délka nezměnila, zachovat přesné sekundy z časovače
    const keepSeconds = meditation && Math.round(meditation.duration_s / 60) === mins;
    const next: Meditation = {
      id: meditation?.id ?? crypto.randomUUID(),
      started_at: date.toISOString(),
      duration_s: keepSeconds ? meditation.duration_s : Math.round(mins * 60),
      note: note.trim() || null,
    };
    if (meditation) update.mutate(next);
    else add.mutate(next);
    onClose();
  };

  return (
    <Sheet title={meditation ? "Upravit meditaci" : "Přidat meditaci zpětně"} onClose={onClose}>
      <div className="form">
        <label htmlFor="m-when" className="field-label">Kdy</label>
        <input id="m-when" className="input" type="datetime-local" max={toLocalInput(new Date())} value={when} onChange={(e) => setWhen(e.target.value)} />
        <label htmlFor="m-min" className="field-label">Délka v minutách</label>
        <input id="m-min" className="input" type="number" inputMode="numeric" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        <label htmlFor="m-note" className="field-label">Poznámka</label>
        <input id="m-note" className="input" placeholder="Nepovinné" value={note} onChange={(e) => setNote(e.target.value)} />
        {!valid && <p className="error">Zadej čas, který už proběhl, a délku 1–600 minut.</p>}
        <button className="btn dark tap wide" disabled={!valid} onClick={save}>{meditation ? "Uložit" : "Přidat meditaci"}</button>
        {meditation && <button className="btn tap wide" onClick={() => { remove.mutate(meditation.id); onClose(); }}>Smazat meditaci</button>}
      </div>
    </Sheet>
  );
}

function GoalSheet({ goal, onClose, onSave }: { goal: number; onClose: () => void; onSave: (goal: number) => void }) {
  const [value, setValue] = useState(goal);
  return (
    <Sheet title="Cíl meditací za týden" onClose={onClose}>
      <div className="stepper">
        <button className="icon-btn big" aria-label="Méně" disabled={value <= 1} onClick={() => setValue((v) => v - 1)}>−</button>
        <span className="stepper-value" aria-live="polite">{value}×</span>
        <button className="icon-btn big" aria-label="Více" disabled={value >= 14} onClick={() => setValue((v) => v + 1)}>+</button>
      </div>
      <button className="btn dark tap wide" onClick={() => { onSave(value); onClose(); }}>Uložit cíl</button>
    </Sheet>
  );
}
