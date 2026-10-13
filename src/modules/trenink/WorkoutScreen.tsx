import { useEffect, useState, type CSSProperties } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Burst } from "../../components/Burst";
import { Icon } from "../../components/Icon";
import { Topbar } from "../../components/Topbar";
import { formatNumber, plural } from "../../lib/format";
import { haptic } from "../../lib/haptic";
import { MODULE_BY_KEY } from "../../lib/modules";
import { playSound, unlockAudio } from "../../lib/sound";
import { soundPrefs } from "../../lib/soundPrefs";
import { useWakeLock } from "../../lib/wakeLock";
import { addSet, finishWork, moveExercise, removeExercise, removeSet, setField, startWork, toggleDone, useActiveWorkout, type ActiveWorkout } from "./active";
import { doneSetCount, formatSet, lastSetsFor, newRecords, prefillSets, setMode, useAddWorkout, useExercises, useWorkouts, workoutVolume, type SetEntry, type Workout } from "./data";
import { ExercisePicker } from "./ExercisePicker";
import type { Exercise } from "./exercises";
import { confirmAction } from "../../components/Confirm";

const MODULE = MODULE_BY_KEY.trenink;

function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(s % 60).padStart(2, "0")}`;
};

interface Summary {
  workout: Workout;
  records: { name: string; text: string }[];
}

export function WorkoutScreen() {
  const { active, update, clear } = useActiveWorkout();
  const { data: workouts = [] } = useWorkouts();
  const { byId } = useExercises();
  const add = useAddWorkout();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  useWakeLock(!!active);

  if (summary) return <SummaryView summary={summary} />;
  if (!active) return <Navigate to="/m/trenink" replace />;

  const finish = async () => {
    const exercises = active.exercises
      .map((we) => ({ ...we, sets: we.sets.filter((s) => s.done) }))
      .filter((we) => we.sets.length > 0);
    if (exercises.length === 0) {
      if (await confirmAction("Žádná série není odškrtnutá. Zahodit trénink?", "Zahodit trénink")) { clear(); navigate("/m/trenink", { replace: true }); }
      return;
    }
    const workout: Workout = {
      id: crypto.randomUUID(), name: active.name, template_id: active.template_id, started_at: active.started_at,
      finished_at: new Date().toISOString(), exercises, note: null,
    };
    const records = newRecords(workout, workouts).map((r) => ({ name: byId.get(r.exercise_id)?.name ?? "Cvik", text: r.text }));
    add.mutate(workout);
    clear();
    playSound(soundPrefs().workoutEnd);
    setSummary({ workout, records });
  };

  const addExercise = (e: Exercise) =>
    update((w) => ({ ...w, exercises: [...w.exercises, { exercise_id: e.id, sets: prefillSets(e.id, 3, workouts) }] }));

  return (
    <div className="screen module workout" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title={active.name} back="/m/trenink" right={<Elapsed since={active.started_at} />} />

      {active.exercises.length === 0 && <p className="empty">Přidej první cvik.</p>}
      {active.exercises.map((we, ex) => {
        const exercise = byId.get(we.exercise_id);
        const rest = we.rest_s ?? exercise?.rest_s ?? 90;
        return (
          <ExerciseCard
            key={`${we.exercise_id}-${ex}`}
            exercise={exercise}
            mode={setMode(we.mode, exercise)}
            running={active.work?.ex === ex ? active.work.set : null}
            onStart={(set) => { unlockAudio(); update((w) => startWork(w, ex, set, w.exercises[ex].sets[set].seconds || 60)); }}
            sets={we.sets}
            last={lastSetsFor(we.exercise_id, workouts)}
            isFirst={ex === 0}
            isLast={ex === active.exercises.length - 1}
            onChange={(set, patch) => update((w) => setField(w, ex, set, patch))}
            onToggle={(set) => { unlockAudio(); haptic(); update((w) => toggleDone(w, ex, set, rest)); }}
            onAddSet={() => update((w) => addSet(w, ex))}
            onRemoveSet={() => update((w) => removeSet(w, ex))}
            onMove={(dir) => update((w) => moveExercise(w, ex, dir))}
            onRemove={() => void confirmAction(`Odebrat ${exercise?.name ?? "cvik"} z tréninku?`, "Odebrat").then((ok) => ok && update((w) => removeExercise(w, ex)))}
          />
        );
      })}

      <button className="btn tap wide" onClick={() => setPicking(true)}><Icon name="i-plus" size={20} /> Přidat cvik</button>
      <button className="btn-hero" onClick={finish}><Icon name="check" size={32} /> Dokončit trénink</button>
      <button className="link timer-cancel" onClick={async () => {
        if (await confirmAction("Zrušit trénink bez uložení?", "Zrušit trénink", "Pokračovat")) { clear(); navigate("/m/trenink", { replace: true }); }
      }}>Zrušit bez uložení</button>

      <WorkBar active={active} update={update} restFor={(ex) => active.exercises[ex]?.rest_s ?? byId.get(active.exercises[ex]?.exercise_id)?.rest_s ?? 90} />
      <RestBar active={active} update={update} />
      {picking && <ExercisePicker onClose={() => setPicking(false)} onPick={addExercise} exclude={active.exercises.map((e) => e.exercise_id)} />}
    </div>
  );
}

function Elapsed({ since }: { since: string }) {
  const now = useNow(1000);
  return <span className="elapsed" aria-label="Doba tréninku">{clock(now - new Date(since).getTime())}</span>;
}

/** Série na čas: odpočet nad spodní lištou, na konci pípne, odškrtne sérii a spustí pauzu. */
function WorkBar({ active, update, restFor }: { active: ActiveWorkout; update: (fn: (w: ActiveWorkout) => ActiveWorkout) => void; restFor: (ex: number) => number }) {
  const now = useNow(250);
  const work = active.work;
  const left = work ? work.until - now : 0;

  useEffect(() => {
    if (work && left <= 0) {
      if (left > -5000) {
        playSound(soundPrefs().restEnd);
        navigator.vibrate?.(200);
      }
      update((w) => finishWork(w, restFor(work.ex)));
    }
  }, [work, left, update, restFor]);

  if (!work || left <= 0) return null;
  return (
    <div className="rest-bar work-bar" role="timer" aria-label="Série na čas">
      <span className="rest-fill" style={{ width: `${Math.min(100, 100 - (left / (work.total * 1000)) * 100)}%` }} />
      <span className="rest-time">Cvič {clock(left + 999)}</span>
      <button onClick={() => update((w) => ({ ...w, work: null }))} aria-label="Zrušit sérii">×</button>
      <button onClick={() => update((w) => finishWork(w, restFor(work.ex)))}>Hotovo</button>
    </div>
  );
}

/** Pauza po sérii: odpočet nad spodní lištou, na konci pípne. */
function RestBar({ active, update }: { active: ActiveWorkout; update: (fn: (w: ActiveWorkout) => ActiveWorkout) => void }) {
  const now = useNow(250);
  const left = active.rest_until ? active.rest_until - now : 0;

  useEffect(() => {
    if (active.rest_until && left <= 0) {
      // po návratu do appky po dlouhé době už nepípat
      if (left > -5000) {
        playSound(soundPrefs().restEnd);
        navigator.vibrate?.(200);
      }
      update((w) => ({ ...w, rest_until: null }));
    }
  }, [active.rest_until, left, update]);

  if (!active.rest_until || left <= 0 || active.work) return null;
  const shift = (s: number) => update((w) => (w.rest_until ? { ...w, rest_until: w.rest_until + s * 1000, rest_total: Math.max(1, w.rest_total + s) } : w));
  return (
    <div className="rest-bar" role="timer" aria-label="Pauza">
      <span className="rest-fill" style={{ width: `${Math.min(100, (left / (active.rest_total * 1000)) * 100)}%` }} />
      <span className="rest-time">Pauza {clock(left + 999)}</span>
      <button onClick={() => shift(-15)} aria-label="O 15 sekund kratší">−15</button>
      <button onClick={() => shift(15)} aria-label="O 15 sekund delší">+15</button>
      <button onClick={() => update((w) => ({ ...w, rest_until: null }))}>Dál</button>
    </div>
  );
}

function ExerciseCard({ exercise, mode, running, onStart, sets, last, isFirst, isLast, onChange, onToggle, onAddSet, onRemoveSet, onMove, onRemove }: {
  exercise: Exercise | undefined;
  /** Série na opakování, nebo na čas (s odpočtem). */
  mode: "reps" | "time";
  /** Která série právě běží na čas. */
  running: number | null;
  onStart: (set: number) => void;
  sets: SetEntry[];
  last: SetEntry[];
  isFirst: boolean;
  isLast: boolean;
  onChange: (set: number, patch: Partial<SetEntry>) => void;
  onToggle: (set: number) => void;
  onAddSet: () => void;
  onRemoveSet: () => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const kind = exercise?.kind ?? "weight_reps";
  const kg = kind === "weight_reps";
  const timed = mode === "time";
  return (
    <section className={`panel wx${kg ? "" : " wx-narrow"}${timed ? " wx-timed" : ""}`}>
      <div className="wx-head">
        <div className="grow">
          <h3>{exercise?.name ?? "Smazaný cvik"}</h3>
          <p className="small muted">{last.length ? `Minule: ${last.map(formatSet).join(", ")}` : "Poprvé – ať to stojí za to."}</p>
        </div>
        <div className="wx-tools">
          <button className="icon-btn" aria-label="Posunout nahoru" disabled={isFirst} onClick={() => onMove(-1)}><Icon name="i-up" size={16} /></button>
          <button className="icon-btn" aria-label="Posunout dolů" disabled={isLast} onClick={() => onMove(1)}><Icon name="i-down" size={16} /></button>
          <button className="icon-btn" aria-label="Odebrat cvik" onClick={onRemove}>×</button>
        </div>
      </div>
      <div className="wx-row wx-labels" aria-hidden="true">
        <span>#</span>
        {kg && <span>kg</span>}
        {timed ? <span>sekund</span> : <span>opak.</span>}
        {timed && <span />}
        <span />
      </div>
      {sets.map((s, i) => (
        <div key={i} className={`wx-row${s.done ? " done" : ""}`}>
          <span className="wx-n">{i + 1}</span>
          {kg && <NumInput label={`Série ${i + 1}, kg`} value={s.weight} decimal onChange={(v) => onChange(i, { weight: v })} />}
          {timed
            ? <NumInput label={`Série ${i + 1}, sekund`} value={s.seconds} onChange={(v) => onChange(i, { seconds: v })} />
            : <NumInput label={`Série ${i + 1}, opakování`} value={s.reps} onChange={(v) => onChange(i, { reps: v })} />}
          {timed && (
            // na čas: ▶ spustí odpočet, po doběhnutí se série odškrtne sama (odškrtnout jde i ručně)
            <button className={`wx-play${running === i ? " running" : ""}`} aria-label={`Série ${i + 1}: spustit odpočet`} disabled={s.done || (running !== null && running !== i)} onClick={() => onStart(i)}>
              <Icon name="i-play" size={18} />
            </button>
          )}
          <button className={`wx-check${s.done ? " on" : ""}`} aria-pressed={s.done} aria-label={`Série ${i + 1} hotová`} onClick={() => onToggle(i)}>
            {s.done ? <Icon name="check" size={24} /> : null}
          </button>
        </div>
      ))}
      <div className="wx-sets">
        <button className="link" onClick={onAddSet}>+ Série</button>
        {sets.length > 1 && <button className="link" onClick={onRemoveSet}>− Série</button>}
      </div>
    </section>
  );
}

/** Číselné políčko, které snese i desetinnou čárku („22,5“). */
function NumInput({ value, onChange, decimal, label }: { value: number | null; onChange: (v: number | null) => void; decimal?: boolean; label: string }) {
  const show = (v: number | null) => (v === null ? "" : String(v).replace(".", ","));
  const [text, setText] = useState(show(value));
  const parse = (t: string) => {
    const n = decimal ? parseFloat(t.replace(",", ".")) : parseInt(t, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  useEffect(() => {
    if (parse(text) !== value) setText(show(value));
  }, [value]); // text se schválně nehlídá – jinak by se přepisovalo rozepsané „22,“
  return (
    <input
      className="input wx-input"
      aria-label={label}
      inputMode={decimal ? "decimal" : "numeric"}
      value={text}
      placeholder="–"
      onFocus={(e) => e.target.select()}
      onChange={(e) => { setText(e.target.value); onChange(parse(e.target.value)); }}
    />
  );
}

function SummaryView({ summary }: { summary: Summary }) {
  const { workout, records } = summary;
  const minutes = Math.round((new Date(workout.finished_at).getTime() - new Date(workout.started_at).getTime()) / 60000);
  const volume = workoutVolume(workout);
  const sets = doneSetCount(workout);
  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="hero summary-hero">
        <span className="icon-slot anim-jump"><Icon name="trenink" size={96} /></span>
        <Burst trigger={1} text={records.length ? "Rekord!" : "Hotovo!"} />
        <span className="hero-num">{minutes}</span>
        <span className="hero-cap">{plural(minutes, ["minuta", "minuty", "minut"])} makačky</span>
        <p className="hero-line">{workout.name}</p>
      </div>
      <div className="score">
        <div><b>{sets}</b><span>{plural(sets, ["série", "série", "sérií"])}</span></div>
        <div><b>{workout.exercises.length}</b><span>{plural(workout.exercises.length, ["cvik", "cviky", "cviků"])}</span></div>
        <div><b>{volume ? formatNumber(volume, 0) : "–"}</b><span>kg objem</span></div>
      </div>
      {records.length > 0 && (
        <div className="panel" style={{ marginTop: 14 }}>
          <h3>Nové rekordy</h3>
          <ul className="plan">
            {records.map((r) => <li key={r.name}><Icon name="trophy" size={24} />{r.name}: {r.text}</li>)}
          </ul>
        </div>
      )}
      <Link to="/m/trenink" className="btn-hero">Zpět</Link>
    </div>
  );
}
