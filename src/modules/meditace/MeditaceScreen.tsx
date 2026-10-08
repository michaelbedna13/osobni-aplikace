import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Columns } from "../../components/Charts";
import { Sheet } from "../../components/Sheet";
import { Sprite } from "../../components/Sprite";
import { useToast } from "../../components/Toast";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { meditationDone } from "../../lib/copy";
import { addDays, relativeTime, startOfWeek, toLocalInput, WEEKDAYS_SHORT } from "../../lib/dates";
import { formatDate, formatNumber, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useSettings } from "../../lib/settings";
import { playSound, unlockAudio, SOUND_NAMES } from "../../lib/sound";
import { soundPrefs, useSoundPrefs } from "../../lib/soundPrefs";
import { SoundPicker } from "../../components/SoundPicker";
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
const DNI: [string, string, string] = ["den", "dny", "dní"];
const SEGMENTS = 32;

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
    playSound(soundPrefs().medStart);
  }, [setTimer]);

  const [celebrate, setCelebrate] = useState(0);

  const finish = useCallback((state: TimerState, { gong }: { gong: boolean }) => {
    setTimer(null);
    const seconds = finalSeconds(state);
    if (gong) playSound(soundPrefs().medEnd);
    if (seconds < 30) {
      toast.show("Kratší než 30 s, to se nepočítá");
      return;
    }
    add.mutate({ id: crypto.randomUUID(), started_at: state.startedAt, duration_s: seconds, note: null });
    toast.show(`${formatDuration(seconds)} uloženo. ${meditationDone(seconds / 60)}`);
    setCelebrate((c) => c + 1);
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
        <Overview onStart={start} celebrate={celebrate} />
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
  const { prefs } = useSoundPrefs();
  const bell = useRef<number | null>(null);
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

  // zvonek během meditace každých N minut (ne těsně před koncem)
  useEffect(() => {
    if (!running || !prefs.medInterval) return;
    const e = elapsedSeconds(timer, now);
    const k = Math.floor(e / (prefs.medInterval * 60));
    if (bell.current === null) bell.current = k;
    if (k > bell.current) {
      bell.current = k;
      if (timer.plannedSeconds === null || e < timer.plannedSeconds - 10) playSound(prefs.medIntervalSound);
    }
  }, [now, running, timer, prefs.medInterval, prefs.medIntervalSound]);

  const elapsed = elapsedSeconds(timer, now);
  const shown = timer.plannedSeconds === null ? elapsed : Math.max(0, timer.plannedSeconds - elapsed);
  const pct = timer.plannedSeconds === null ? (elapsed % 60) / 60 : Math.min(1, elapsed / timer.plannedSeconds);
  const mm = String(Math.floor(shown / 60)).padStart(2, "0");
  const ss = String(Math.floor(shown % 60)).padStart(2, "0");
  const lit = Math.round(pct * SEGMENTS);
  const inhale = Math.floor(elapsed / 4) % 2 === 0;

  return (
    <div className="screen" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title="Meditace" back={null} />
      <div className="timer-wrap">
        <div className="ring" role="timer" aria-label={`${timer.plannedSeconds === null ? "Uplynulo" : "Zbývá"} ${mm}:${ss}`}>
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const a = (i / SEGMENTS) * Math.PI * 2 - Math.PI / 2;
            return (
              <i
                key={i}
                className={`ring-seg${i < lit ? " on" : ""}`}
                style={{ transform: `translate(${Math.round(Math.cos(a) * 124)}px, ${Math.round(Math.sin(a) * 124)}px)` }}
              />
            );
          })}
          <div className="ring-center">
            <Sprite name="meditace" size={96} anim={running ? "breathe" : undefined} />
            <span className="timer-time">{mm}:{ss}</span>
            <span className="timer-of">{timer.plannedSeconds === null ? "bez omezení" : `z ${formatDuration(timer.plannedSeconds)}`}</span>
          </div>
        </div>
      </div>
      <p className="breath" aria-live="off">{running ? (inhale ? "Nádech…" : "Výdech…") : "Pauza. Klidně si protáhni nohy."}</p>
      <div className="timer-actions">
        {running
          ? <button className="btn tap" onClick={onPause}>Pauza</button>
          : <button className="btn tap" onClick={onResume}>Pokračovat</button>}
        <button className="btn dark tap" onClick={() => { finishing.current = true; onFinish(true); }}>Hotovo</button>
      </div>
      <button className="link timer-cancel" onClick={onCancel}>Zrušit bez uložení</button>
    </div>
  );
}

function Overview({ onStart, celebrate }: { onStart: (minutes: number) => void; celebrate: number }) {
  const { data: list = [], isLoading, error } = useMeditations();
  const { settings, update } = useSettings();
  const goal = Math.min(7, settings.meditation_weekly_goal);
  const stats = useMemo(() => computeMeditationStats(list, goal), [list, goal]);
  const [minutes, setMinutes] = useState(loadLastMinutes);
  const [editing, setEditing] = useState<Meditation | "new" | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const [soundsOpen, setSoundsOpen] = useState(false);
  const { prefs } = useSoundPrefs();
  const [tab, setTab] = useState<"cil" | "statistiky" | "historie">("cil");
  const weeks = useMemo(() => groupByWeek(list.slice(0, 40)), [list]);
  const goalDone = stats.weekDays >= goal;

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Meditace" />
        <div className="hero">
          <span key={celebrate} className={`sprite-tile ${celebrate ? "anim-jump" : ""}`}><Sprite name="meditace" size={96} /></span>
          <Burst trigger={celebrate} colors={["#FFFFFF", MODULE.deep, "#FEE761"]} />
          <span className="hero-num">{stats.weekDays}<span style={{ fontSize: "0.45em" }}>/{goal}</span></span>
          <span className="hero-cap">{goalDone ? "cíl na týden splněný!" : `${plural(stats.weekDays, DNI)} s meditací tento týden`}</span>
        </div>
        <div className="durations" role="group" aria-label="Délka meditace">
          {DURATIONS.map((d) => (
            <button key={d} className={`chip${minutes === d ? " on" : ""}`} aria-pressed={minutes === d} onClick={() => setMinutes(d)}>
              {d ? `${d} min` : "Bez limitu"}
            </button>
          ))}
        </div>
        <button className="btn-hero" onClick={() => onStart(minutes)}>
          <Sprite name="i-play" size={22} /> Začít
        </button>
        <button className="link sound-link" onClick={() => setSoundsOpen(true)}>
          Zvuky: {SOUND_NAMES[prefs.medStart]} · {SOUND_NAMES[prefs.medEnd]}{prefs.medInterval ? ` · zvonek po ${prefs.medInterval} min` : ""}
        </button>
      </div>

      {error && <p className="error">Nepodařilo se načíst meditace. Zkontroluj připojení.</p>}

      <Tabs
        label="Zobrazení"
        value={tab}
        onChange={setTab}
        items={[{ id: "cil", label: "Cíl" }, { id: "statistiky", label: "Statistiky" }, { id: "historie", label: "Historie" }]}
      />

      {tab === "cil" && (
        <div className="tab-panel">
          <div className="panel">
            <div className="row-between">
              <h3>Cíl {goal} {plural(goal, DNI)} v týdnu</h3>
              <button className="link" onClick={() => setGoalOpen(true)}>Změnit</button>
            </div>
            <div className="week-blocks">
              {WEEKDAYS_SHORT.map((d, i) => {
                const v = stats.thisWeek[i];
                return (
                  <div key={d} className="week-block">
                    <i className={v === null ? "future" : v > 0 ? "done" : undefined}>
                      {v ? <Sprite name="check" size={28} tone="meditace" /> : null}
                    </i>
                    <span className={i === stats.todayIndex ? "today" : undefined}>{d}</span>
                    <span className="sr-only">{v === null ? "ještě nebylo" : v > 0 ? `${v} min` : "bez meditace"}</span>
                  </div>
                );
              })}
            </div>
            <p className="goal-line">
              {stats.weekStreak > 0 && <Sprite name="flame" size={24} tone="trenink" />}
              {goalDone ? "Splněno! " : `Ještě ${goal - stats.weekDays} ${plural(goal - stats.weekDays, DNI)} a máš to. `}
              {stats.weekStreak > 0 && `Série ${stats.weekStreak} ${plural(stats.weekStreak, ["týden", "týdny", "týdnů"])}.`}
            </p>
          </div>
          {stats.totalCount > 0 && (
            <div className="score" style={{ marginTop: 0 }}>
              <div><b>{formatNumber(stats.weekMinutes, 0)}</b><span>min tento týden</span></div>
              <div><b>{formatNumber(stats.monthMinutes, 0)}</b><span>min tento měsíc</span></div>
              <div><b>{formatNumber(stats.totalMinutes / 60)}</b><span>hodin celkem</span></div>
            </div>
          )}
        </div>
      )}

      {tab === "statistiky" && (
        <div className="tab-panel">
          {stats.totalCount === 0 ? <p className="empty">Statistiky se ukážou po první meditaci.</p> : (
            <>
              <div className="panel">
                <h3>Minuty za 12 týdnů</h3>
                <Columns
                  values={stats.lastWeeks.map((w) => w.minutes)}
                  labels={stats.lastWeeks.map((w, i) => (i === 11 ? "teď" : i % 3 === 2 ? formatDate(w.start) : ""))}
                  highlight={11}
                  color={MODULE.color}
                  label={`Minuty meditace po týdnech: ${stats.lastWeeks.map((w) => `od ${formatDate(w.start)} ${w.minutes}`).join(", ")}`}
                />
              </div>
              <div className="trophies">
                {stats.longest && (
                  <div className="trophy gold">
                    <Sprite name="trophy" size={40} />
                    <b>{formatDuration(stats.longest.duration_s)}</b>
                    <span>nejdelší ({formatDate(new Date(stats.longest.started_at), true)})</span>
                  </div>
                )}
                <div className="trophy">
                  <Sprite name="flame" size={40} tone="trenink" />
                  <b>{stats.weekStreak}</b>
                  <span>{plural(stats.weekStreak, ["týden", "týdny", "týdnů"])} v řadě se splněným cílem</span>
                </div>
                <div className="trophy">
                  <b>{formatNumber(stats.averageMinutes, 0)} min</b>
                  <span>průměrná délka</span>
                </div>
                <div className="trophy">
                  <b>{stats.totalCount}</b>
                  <span>{plural(stats.totalCount, KRAT)} celkem</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "historie" && (
        <div className="tab-panel">
          <div className="row-between">
            <p className="small">Ťukni na meditaci a uprav ji.</p>
            <button className="link" onClick={() => setEditing("new")}>Přidat zpětně</button>
          </div>
          {isLoading ? (
            <p>Načítám…</p>
          ) : list.length === 0 ? (
            <p className="empty">Zatím nic. Vyber délku a dej „Začít“.</p>
          ) : (
            weeks.map((w) => (
              <section key={w.label}>
                <h3 className="history-label">
                  <span>{w.label}</span><span>{w.items.length}×, {formatDuration(w.seconds)}</span>
                </h3>
                <ul className="list">
                  {w.items.map((m) => (
                    <li key={m.id}>
                      <button className="list-btn" onClick={() => setEditing(m)}>
                        <Sprite name="meditace" size={24} />
                        <span className="grow">{relativeTime(new Date(m.started_at))}{m.note ? ` – ${m.note}` : ""}</span>
                        <b>{formatDuration(m.duration_s)}</b>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      )}

      {editing && <MeditationSheet meditation={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {soundsOpen && <MeditationSounds onClose={() => setSoundsOpen(false)} />}
      {goalOpen && <GoalSheet goal={goal} onClose={() => setGoalOpen(false)} onSave={(g) => update({ meditation_weekly_goal: g })} />}
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
  const [value, setValue] = useState(Math.min(7, goal));
  return (
    <Sheet title="Kolik dní v týdnu meditovat" onClose={onClose}>
      <div className="stepper">
        <button className="icon-btn big tap" aria-label="Méně" disabled={value <= 1} onClick={() => setValue((v) => v - 1)}>−</button>
        <span className="stepper-value" aria-live="polite">{value} {plural(value, DNI)}</span>
        <button className="icon-btn big tap" aria-label="Více" disabled={value >= 7} onClick={() => setValue((v) => Math.min(7, v + 1))}>+</button>
      </div>
      <p className="small muted">Počítají se dny s meditací. Dvě meditace v jeden den jsou pořád jeden den.</p>
      <button className="btn dark tap wide" onClick={() => { onSave(value); onClose(); }}>Uložit cíl</button>
    </Sheet>
  );
}

/** Zvuky meditace: začátek, konec a volitelný zvonek během. */
function MeditationSounds({ onClose }: { onClose: () => void }) {
  const { prefs, update } = useSoundPrefs();
  return (
    <Sheet title="Zvuky meditace" onClose={onClose}>
      <p className="small muted">Ťuknutím zvuk vybereš a rovnou uslyšíš. Na iPhonu musí být vypnutý tichý režim.</p>
      <SoundPicker label="Začátek" value={prefs.medStart} onChange={(v) => update({ medStart: v })} exclude={["fanfara", "pipnuti"]} />
      <SoundPicker label="Konec" value={prefs.medEnd} onChange={(v) => update({ medEnd: v })} exclude={["fanfara", "pipnuti"]} />
      <span className="field-label">Zvonek během meditace (každých … minut)</span>
      <div className="seg seg-wide" role="group" aria-label="Zvonek během meditace">
        {[0, 1, 3, 5, 10].map((m) => (
          <button key={m} type="button" className={`seg-btn${prefs.medInterval === m ? " on" : ""}`} aria-pressed={prefs.medInterval === m} onClick={() => update({ medInterval: m })}>
            {m ? String(m) : "Ne"}
          </button>
        ))}
      </div>
      {prefs.medInterval > 0 && (
        <SoundPicker label={`Každých ${prefs.medInterval} min zazní`} value={prefs.medIntervalSound} onChange={(v) => update({ medIntervalSound: v })} exclude={["fanfara", "ticho"]} />
      )}
      <button className="btn dark tap wide" onClick={onClose}>Hotovo</button>
    </Sheet>
  );
}
